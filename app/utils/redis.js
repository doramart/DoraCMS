/* !
 * redis client
 */
'use strict';
const redis = require('redis');
const settings = require('@configs/settings');

const client = redis.createClient(settings.redis_port, settings.redis_host);
client.auth(settings.redis_psd);
module.exports = client;
