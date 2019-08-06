// 备份DB数据
require('shelljs/global')
require('module-alias/register')
const muri = require('muri')
const moment = require("moment");
const settings = require('@configs/settings');

let databackforder = process.cwd() + '/databak/';

let dataPath = databackforder + moment().format('YYYYMMDDHHmmss').toString();

const mongoUri = settings.mongo_connection_uri
const parsedUri = muri(mongoUri)
const parameters = []

if (parsedUri.auth) {
    parameters.push(`-u "${parsedUri.auth.user}"`, `-p "${parsedUri.auth.pass}"`)
}

if (parsedUri.db) {
    parameters.push(`-d "${parsedUri.db}"`)
}

parameters.push(`-o "${dataPath}"`)

const cmd = `mongodump ${parameters.join(' ')}`

exec(cmd).stdout;