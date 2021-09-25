/*
 * @Author: doramart
 * @Date: 2019-11-20 14:25:22
 * @Description 导入DB数据
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 22:07:14
 */
'use strict';
require('shelljs/global');
const muri = require('muri');
const settings = require('../config/config.local');

const mongoUri = settings({
  baseDir: '.',
}).mongoose.client.url;
const parsedUri = muri(mongoUri);
const parameters = [];

if (parsedUri.hosts && parsedUri.hosts.length) {
  const host = parsedUri.hosts[0];
  parameters.push(`-h ${host.host}`, `--port ${host.port}`);
}

if (parsedUri.auth) {
  parameters.push(`-u "${parsedUri.auth.user}"`, `-p "${parsedUri.auth.pass}"`);
}

if (parsedUri.db) {
  parameters.push(`-d "${parsedUri.db}"`);
}

parameters.push(`--drop ./databak/${parsedUri.db}`);

const cmd = `mongorestore ${parameters.join(' ')}`;

exec(cmd).stdout;
