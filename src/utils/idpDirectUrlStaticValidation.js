const { isIP } = require('node:net');

// IANA Special-Use Domain Names registry snapshot reviewed on 2026-07-22:
// https://www.iana.org/assignments/special-use-domain-names/special-use-domain-names.xhtml
const SPECIAL_USE_DOMAIN_SUFFIXES = new Set([
  'alt',
  '6tisch.arpa',
  'eap.arpa',
  'eap-noob.arpa',
  'home.arpa',
  '10.in-addr.arpa',
  '254.169.in-addr.arpa',
  '16.172.in-addr.arpa',
  '17.172.in-addr.arpa',
  '18.172.in-addr.arpa',
  '19.172.in-addr.arpa',
  '20.172.in-addr.arpa',
  '21.172.in-addr.arpa',
  '22.172.in-addr.arpa',
  '23.172.in-addr.arpa',
  '24.172.in-addr.arpa',
  '25.172.in-addr.arpa',
  '26.172.in-addr.arpa',
  '27.172.in-addr.arpa',
  '28.172.in-addr.arpa',
  '29.172.in-addr.arpa',
  '30.172.in-addr.arpa',
  '31.172.in-addr.arpa',
  '168.192.in-addr.arpa',
  '170.0.0.192.in-addr.arpa',
  '171.0.0.192.in-addr.arpa',
  '8.e.f.ip6.arpa',
  '9.e.f.ip6.arpa',
  'a.e.f.ip6.arpa',
  'b.e.f.ip6.arpa',
  'ipv4only.arpa',
  'resolver.arpa',
  'service.arpa',
  'example',
  'example.com',
  'example.net',
  'example.org',
  'invalid',
  'local',
  'localhost',
  'onion',
  'test'
]);

// IANA IPv4 Special-Purpose Address registry snapshot reviewed on 2026-07-22:
// https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml
// Rules are evaluated by longest prefix first so the globally reachable /32 exceptions win.
const IPV4_RULES = buildIpv4Rules([
  ['192.0.0.9', 32, true],
  ['192.0.0.10', 32, true],
  ['0.0.0.0', 8, false],
  ['10.0.0.0', 8, false],
  ['100.64.0.0', 10, false],
  ['127.0.0.0', 8, false],
  ['169.254.0.0', 16, false],
  ['172.16.0.0', 12, false],
  ['192.0.0.0', 24, false],
  ['192.0.2.0', 24, false],
  ['192.88.99.0', 24, false],
  ['192.168.0.0', 16, false],
  ['198.18.0.0', 15, false],
  ['198.51.100.0', 24, false],
  ['203.0.113.0', 24, false],
  ['224.0.0.0', 4, false],
  ['240.0.0.0', 4, false]
]);

// IANA IPv6 Special-Purpose Address registry snapshot reviewed on 2026-07-22:
// https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml
// Only confirmed global unicast is allowed. More-specific global exceptions under 2001::/23 win.
const IPV6_RULES = buildIpv6Rules([
  ['2001:1::1', 128, true],
  ['2001:1::2', 128, true],
  ['2001:1::3', 128, true],
  ['2001:4:112::', 48, true],
  ['2001:3::', 32, true],
  ['2001:20::', 28, true],
  ['2001:30::', 28, true],
  ['::', 96, false],
  ['::ffff:0:0', 96, false],
  ['64:ff9b::', 96, false],
  ['64:ff9b:1::', 48, false],
  ['100::', 64, false],
  ['100:0:0:1::', 64, false],
  ['2001::', 32, false],
  ['2001:2::', 48, false],
  ['2001:10::', 28, false],
  ['2001::', 23, false],
  ['2001:db8::', 32, false],
  ['2002::', 16, false],
  ['3fff::', 20, false],
  ['5f00::', 16, false],
  ['fc00::', 7, false],
  ['fe80::', 10, false],
  ['ff00::', 8, false],
  ['2000::', 3, true]
]);

function validateIdpDirectUrlStatic(value) {
  if (typeof value !== 'string') {
    return { ok: false, reason: 'invalid_url' };
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return { ok: false, reason: 'invalid_url' };
  }
  if (containsUnsafeUrlCharacter(trimmedValue)) {
    return { ok: false, reason: 'unsafe_url_character' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedValue);
  } catch (error) {
    return { ok: false, reason: 'invalid_url' };
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { ok: false, reason: 'unsupported_protocol', protocol: parsedUrl.protocol };
  }
  if (!parsedUrl.hostname) {
    return { ok: false, reason: 'hostname_missing', protocol: parsedUrl.protocol };
  }
  if (parsedUrl.username || parsedUrl.password || rawAuthorityContainsUserinfo(trimmedValue)) {
    return { ok: false, reason: 'userinfo_not_allowed', protocol: parsedUrl.protocol };
  }

  const normalizedHostname = normalizeHostname(parsedUrl.hostname);
  if (!normalizedHostname) {
    return { ok: false, reason: 'hostname_missing', protocol: parsedUrl.protocol };
  }

  const detectedIpVersion = isIP(normalizedHostname);
  const ipVersion = detectedIpVersion === 4 ? 4 : detectedIpVersion === 6 ? 6 : 0;
  if (ipVersion === 4 && !isGloballyReachableIpv4(normalizedHostname)) {
    return { ok: false, reason: 'non_global_ipv4', normalizedHostname, ipVersion };
  }
  if (ipVersion === 6 && !isGloballyReachableIpv6(normalizedHostname)) {
    return { ok: false, reason: 'non_global_ipv6', normalizedHostname, ipVersion };
  }
  if (ipVersion === 0 && isSpecialUseHostname(normalizedHostname)) {
    return { ok: false, reason: 'special_use_hostname', normalizedHostname, ipVersion };
  }

  return {
    ok: true,
    value: trimmedValue,
    parsedUrl,
    normalizedHostname,
    ipVersion
  };
}

function containsUnsafeUrlCharacter(value) {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 0x20 || codePoint === 0x7f || character === '\\') {
      return true;
    }
  }
  return false;
}

function rawAuthorityContainsUserinfo(value) {
  const schemeEnd = value.indexOf(':');
  if (schemeEnd < 0 || value.slice(schemeEnd + 1, schemeEnd + 3) !== '//') {
    return false;
  }

  const authorityStart = schemeEnd + 3;
  const authorityEndOffset = value.slice(authorityStart).search(/[/?#]/u);
  const authorityEnd = authorityEndOffset < 0 ? value.length : authorityStart + authorityEndOffset;
  return value.slice(authorityStart, authorityEnd).includes('@');
}

function normalizeHostname(hostname) {
  const withoutBrackets = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
  const lowerCaseHostname = withoutBrackets.toLowerCase();
  return lowerCaseHostname.endsWith('.') ? lowerCaseHostname.slice(0, -1) : lowerCaseHostname;
}

function isSpecialUseHostname(hostname) {
  for (const suffix of SPECIAL_USE_DOMAIN_SUFFIXES) {
    if (hostname === suffix || hostname.endsWith(`.${suffix}`)) {
      return true;
    }
  }
  return false;
}

function isGloballyReachableIpv4(hostname) {
  const address = parseIpv4(hostname);
  if (address === null) {
    return false;
  }
  return IPV4_RULES.find((rule) => matchesCidr(address, rule, 32))?.allow ?? true;
}

function isGloballyReachableIpv6(hostname) {
  const address = parseIpv6(hostname);
  if (address === null) {
    return false;
  }
  return IPV6_RULES.find((rule) => matchesCidr(address, rule, 128))?.allow ?? false;
}

function buildIpv4Rules(entries) {
  return entries
    .map(([network, prefixLength, allow]) => {
      const parsedNetwork = parseIpv4(network);
      if (parsedNetwork === null) {
        throw new Error(`Invalid static IPv4 rule: ${network}`);
      }
      return { network: parsedNetwork, prefixLength, allow };
    })
    .sort((left, right) => right.prefixLength - left.prefixLength);
}

function buildIpv6Rules(entries) {
  return entries
    .map(([network, prefixLength, allow]) => {
      const parsedNetwork = parseIpv6(network);
      if (parsedNetwork === null) {
        throw new Error(`Invalid static IPv6 rule: ${network}`);
      }
      return { network: parsedNetwork, prefixLength, allow };
    })
    .sort((left, right) => right.prefixLength - left.prefixLength);
}

function matchesCidr(address, rule, bitLength) {
  const shift = BigInt(bitLength - rule.prefixLength);
  return address >> shift === rule.network >> shift;
}

function parseIpv4(value) {
  const parts = value.split('.');
  if (parts.length !== 4) {
    return null;
  }

  let result = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/u.test(part)) {
      return null;
    }
    const octet = Number(part);
    if (octet > 255) {
      return null;
    }
    result = (result << 8n) | BigInt(octet);
  }
  return result;
}

function parseIpv6(value) {
  if (value.includes('%')) {
    return null;
  }

  const normalizedValue = normalizeEmbeddedIpv4(value);
  if (normalizedValue === null || normalizedValue.indexOf('::') !== normalizedValue.lastIndexOf('::')) {
    return null;
  }

  const hasCompression = normalizedValue.includes('::');
  const [leftText, rightText = ''] = normalizedValue.split('::');
  const leftParts = leftText ? leftText.split(':') : [];
  const rightParts = rightText ? rightText.split(':') : [];
  const missingParts = 8 - leftParts.length - rightParts.length;

  if ((!hasCompression && missingParts !== 0) || (hasCompression && missingParts < 1)) {
    return null;
  }

  const parts = hasCompression
    ? [...leftParts, ...Array.from({ length: missingParts }, () => '0'), ...rightParts]
    : leftParts;
  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{1,4}$/iu.test(part))) {
    return null;
  }

  return parts.reduce((result, part) => (result << 16n) | BigInt(`0x${part}`), 0n);
}

function normalizeEmbeddedIpv4(value) {
  if (!value.includes('.')) {
    return value;
  }

  const lastColon = value.lastIndexOf(':');
  if (lastColon < 0) {
    return null;
  }
  const ipv4 = parseIpv4(value.slice(lastColon + 1));
  if (ipv4 === null) {
    return null;
  }

  const high = ((ipv4 >> 16n) & 0xffffn).toString(16);
  const low = (ipv4 & 0xffffn).toString(16);
  return `${value.slice(0, lastColon)}:${high}:${low}`;
}

module.exports = { validateIdpDirectUrlStatic };
