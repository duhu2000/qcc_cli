/* eslint-env jest */

const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

function listFilesRecursively(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFilesRecursively(entryPath);
    }
    return [entryPath];
  });
}

function matchesPackagePattern(filePath, pattern) {
  const nestedTestFilePattern = pattern.match(/^([^/]+)\/\*\*\/\*\.test\.js$/);
  if (nestedTestFilePattern) {
    return filePath.startsWith(`${nestedTestFilePattern[1]}/`) && /\.test\.js$/.test(filePath);
  }

  return filePath === pattern;
}

function listWhitelistedFiles() {
  const includes = pkg.files.filter((entry) => !entry.startsWith('!'));
  const excludes = pkg.files
    .filter((entry) => entry.startsWith('!'))
    .map((entry) => entry.slice(1));

  return includes.flatMap((entry) => {
    const entryPath = path.join(__dirname, entry);
    if (!fs.existsSync(entryPath)) {
      return [];
    }
    if (fs.statSync(entryPath).isDirectory()) {
      return listFilesRecursively(entryPath);
    }
    return [entryPath];
  })
    .map((filePath) => path.relative(__dirname, filePath).replace(/\\/g, '/'))
    .filter((filePath) => !excludes.some((pattern) => matchesPackagePattern(filePath, pattern)));
}

test('package publish whitelist excludes test files', () => {
  expect(pkg.files).toEqual([
    'bin/',
    'src/',
    '!bin/**/*.test.js',
    '!src/**/*.test.js'
  ]);

  const testFiles = listWhitelistedFiles().filter((filePath) => /\.test\.js$/.test(filePath));

  expect(testFiles).toEqual([]);
});
