var LRU = require('lru-cache')

let api
if (process.__API__) {
    api = process.__API__
} else {
    api = process.__API__ = {
        api: 'http://localhost:8080/api/',
        port: 8080,
        timeout: 30000,
        cached: LRU({
            max: 1000,
            maxAge: 1000 * 60 * 15
        }),
        cachedItem: {}
    }
}

module.exports = api
