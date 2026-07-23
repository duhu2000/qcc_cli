/* eslint-env jest */

const { validateIdpDirectUrlStatic } = require('./idpDirectUrlStaticValidation');

describe('validateIdpDirectUrlStatic', () => {
  test.each([
    'https://files.qcc.com/report.pdf',
    'http://files.qcc.com/report.pdf',
    'http://files.qcc.com:8080/report.pdf',
    'https://files.qcc.com:8443/report.pdf',
    'http://redis:8080/report.pdf',
    'https://metadata.google.internal/report.pdf',
    'https://localhost.localdomain/report.pdf',
    'https://localhost.example.cn/report.pdf',
    'https://notlocalhost.example.cn/report.pdf',
    'https://local.example.cn/report.pdf',
    'https://test.qcc.com/report.pdf',
    'https://example.qcc.com/report.pdf',
    'https://127.0.0.1.nip.io/report.pdf',
    'https://8.8.8.8/report.pdf',
    'https://192.0.0.9/report.pdf',
    'https://192.0.0.10/report.pdf',
    'https://[2606:4700:4700::1111]/report.pdf',
    'https://[2001:1::1]/report.pdf',
    'https://[2001:3::1]/report.pdf',
    'https://[2001:20::1]/report.pdf',
    'https://[2001:30::1]/report.pdf',
    'https://files.qcc.com/report.pdf?token=secret',
    'https://files.qcc.com/report.pdf?owner=a@b.com',
    'https://files.qcc.com/report%20name.pdf',
    'https://files.qcc.com/report%40owner.pdf',
    'https://files.qcc.com/report.pdf?name=a%20b',
    'https://files.qcc.com/report.pdf?owner=a%40b.com',
    'https://1.0.0.1/report.pdf',
    'https://9.255.255.255/report.pdf',
    'https://11.0.0.0/report.pdf',
    'https://100.63.255.255/report.pdf',
    'https://100.128.0.0/report.pdf',
    'https://126.255.255.255/report.pdf',
    'https://128.0.0.0/report.pdf',
    'https://169.253.255.255/report.pdf',
    'https://169.255.0.0/report.pdf',
    'https://172.15.255.255/report.pdf',
    'https://172.32.0.0/report.pdf',
    'https://192.0.1.255/report.pdf',
    'https://192.0.3.0/report.pdf',
    'https://192.88.98.255/report.pdf',
    'https://192.88.100.0/report.pdf',
    'https://192.167.255.255/report.pdf',
    'https://192.169.0.0/report.pdf',
    'https://198.17.255.255/report.pdf',
    'https://198.20.0.0/report.pdf',
    'https://198.51.99.255/report.pdf',
    'https://198.51.101.0/report.pdf',
    'https://203.0.112.255/report.pdf',
    'https://203.0.114.0/report.pdf',
    'https://223.255.255.255/report.pdf'
  ])('allows %s', (value) => {
    expect(validateIdpDirectUrlStatic(value)).toMatchObject({ ok: true, value });
  });

  test.each([
    'qcc.test',
    'qcc.example.com',
    'example',
    'example.com',
    'files.example.com',
    'invalid',
    'a.invalid',
    'test',
    'files.test',
    'onion',
    'hidden.onion',
    'localhost',
    'localhost.',
    'a.localhost',
    'printer.local',
    'router.home.arpa',
    'resolver.arpa',
    'service.arpa',
    '10.in-addr.arpa',
    '8.e.f.ip6.arpa'
  ])('rejects special-use hostname %s', (hostname) => {
    expect(validateIdpDirectUrlStatic(`https://${hostname}/report.pdf`)).toMatchObject({
      ok: false,
      reason: 'special_use_hostname'
    });
  });

  test.each([
    '0.0.0.1',
    '10.0.0.1',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.0.0.8',
    '192.0.0.170',
    '192.0.2.1',
    '192.88.99.2',
    '192.168.0.1',
    '198.18.0.1',
    '198.51.100.1',
    '203.0.113.1',
    '224.0.0.1',
    '240.0.0.1',
    '255.255.255.255',
    '2130706433',
    '0177.0.0.1',
    '0x7f000001',
    '0X7f000001',
    '127.1'
  ])('rejects IPv4 target %s', (hostname) => {
    expect(validateIdpDirectUrlStatic(`http://${hostname}/report.pdf`)).toMatchObject({
      ok: false,
      reason: 'non_global_ipv4'
    });
  });

  test.each([
    '::',
    '::1',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
    '64:ff9b::808:808',
    '64:ff9b:1::808:808',
    '100::1',
    '100:0:0:1::1',
    '2001::1',
    '2001:2::1',
    '2001:10::1',
    '2001:db8::1',
    '2001:DB8::1',
    '2001:0DB8:0000:0000:0000:0000:0000:0001',
    '2002::1',
    '3fff::1',
    '5f00::1',
    'fc00::1',
    'fe80::1',
    'ff00::1'
  ])('rejects IPv6 target %s', (hostname) => {
    expect(validateIdpDirectUrlStatic(`http://[${hostname}]/report.pdf`)).toMatchObject({
      ok: false,
      reason: 'non_global_ipv6'
    });
  });

  test.each([
    [undefined, 'invalid_url'],
    ['', 'invalid_url'],
    ['   ', 'invalid_url'],
    ['not-a-url', 'invalid_url'],
    ['file:///tmp/report.pdf', 'unsupported_protocol'],
    ['ftp://files.qcc.com/report.pdf', 'unsupported_protocol'],
    ['data:text/plain,report', 'unsupported_protocol'],
    ['javascript:alert(1)', 'unsupported_protocol'],
    ['http://', 'invalid_url'],
    ['http://user@files.qcc.com/report.pdf', 'userinfo_not_allowed'],
    ['http://user:pass@files.qcc.com/report.pdf', 'userinfo_not_allowed'],
    ['http://user%40name@files.qcc.com/report.pdf', 'userinfo_not_allowed'],
    ['http://user%3Apass@files.qcc.com/report.pdf', 'userinfo_not_allowed'],
    ['http://@files.qcc.com/report.pdf', 'userinfo_not_allowed'],
    ['http://files.qcc.com:abc/report.pdf', 'invalid_url'],
    ['http://files.qcc.com:70000/report.pdf', 'invalid_url'],
    ['http://files.qcc.com/re port.pdf', 'unsafe_url_character'],
    ['http://files.qcc.com\\report.pdf', 'unsafe_url_character'],
    ['http://files.qcc.com/\treport.pdf', 'unsafe_url_character'],
    ['http://files.qcc.com/\nreport.pdf', 'unsafe_url_character'],
    ['http://files.qcc.com/\u0000report.pdf', 'unsafe_url_character'],
    ['http://files.qcc.com/\u007freport.pdf', 'unsafe_url_character'],
    ['http://[fe80::1%25eth0]/report.pdf', 'invalid_url']
  ])('rejects invalid input %#', (value, reason) => {
    expect(validateIdpDirectUrlStatic(value)).toMatchObject({ ok: false, reason });
  });

  test('trims only surrounding whitespace and performs no network access', () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;

    const result = validateIdpDirectUrlStatic('  https://files.qcc.com/report.pdf?token=secret  ');

    expect(result).toMatchObject({ ok: true, value: 'https://files.qcc.com/report.pdf?token=secret' });
    expect(fetchSpy).not.toHaveBeenCalled();
    delete global.fetch;
  });
});
