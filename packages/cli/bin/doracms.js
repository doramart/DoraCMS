#!/usr/bin/env node

/**
 * DoraCMS CLI 入口文件
 */

// 检查 Node.js 版本
const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split('.');
const major = parseInt(semver[0], 10);

if (major < 18) {
  console.error(
    '你正在使用 Node.js ' +
      currentNodeVersion +
      '.\n' +
      'DoraCMS CLI 需要 Node.js 18 或更高版本。\n' +
      '请升级你的 Node.js 版本。'
  );
  process.exit(1);
}

// 加载 CLI
require('../dist/index.js');
