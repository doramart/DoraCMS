const LRU = require('lru-cache')
const settings = require('../../utils/settings')
let api
if (process.__API__) {
    api = process.__API__
} else {
    api = process.__API__ = {
        api: 'http://127.0.0.1:' + settings.serverPort + '/api/',
        timeout: 30000,
        cached: LRU({
            max: 1000,
            maxAge: 1000 * 60 * 15
        }),
        cachedItem: {}
    }
}

module.exports = api
