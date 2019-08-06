// 导入DB数据
require('shelljs/global');
require('module-alias/register')
const muri = require('muri')
const settings = require('@configs/settings');

const dbforder = 'doracms2';

const mongoUri = settings.mongo_connection_uri
const parsedUri = muri(mongoUri)
const parameters = []

if (parsedUri.hosts && parsedUri.hosts.length) {
    const host = parsedUri.hosts[0]
    parameters.push(`-h ${host.host}`, `--port ${host.port}`)
}

if (parsedUri.auth) {
    parameters.push(`-u "${parsedUri.auth.user}"`, `-p "${parsedUri.auth.pass}"`)
}

if (parsedUri.db) {
    parameters.push(`-d "${parsedUri.db}"`)
}

parameters.push(`--drop ./databak/${dbforder}/${parsedUri.db}`)

const cmd = `mongorestore ${parameters.join(' ')}`

exec(cmd).stdout;