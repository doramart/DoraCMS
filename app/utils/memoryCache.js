/*
 * @Author: doramart 
 * @Date: 2019-07-16 14:06:28 
 * @Discription 内存数据库
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-16 15:33:41
 */

'use strict';

let cache = Object.create(null);
let debug = false;
let hitCount = 0;
let missCount = 0;
let size = 0;

exports.set = function (key, value, time, timeoutCallback) {
    if (debug) {
        console.log('caching: %s = %j (@%s)', key, value, time);
    }

    if (typeof time !== 'undefined' && (typeof time !== 'number' || isNaN(time) || time <= 0)) {
        throw new Error('Cache timeout must be a positive number');
    } else if (typeof timeoutCallback !== 'undefined' && typeof timeoutCallback !== 'function') {
        throw new Error('Cache timeout callback must be a function');
    }

    let oldRecord = cache[key];
    if (oldRecord) {
        clearTimeout(oldRecord.timeout);
    } else {
        size++;
    }

    let record = {
        value: value,
        expire: time + Date.now()
    };

    if (!isNaN(record.expire)) {
        record.timeout = setTimeout(function () {
            _del(key);
            if (timeoutCallback) {
                timeoutCallback(key, value);
            }
        }, time);
    }

    cache[key] = record;
    return value;
};

exports.del = function (key) {
    let canDelete = true;

    let oldRecord = cache[key];
    if (oldRecord) {
        clearTimeout(oldRecord.timeout);
        if (!isNaN(oldRecord.expire) && oldRecord.expire < Date.now()) {
            canDelete = false;
        }
    } else {
        canDelete = false;
    }

    if (canDelete) {
        _del(key);
    }

    return canDelete;
};

function _del(key) {
    size--;
    delete cache[key];
}

exports.clear = function () {
    for (let key in cache) {
        clearTimeout(cache[key].timeout);
    }
    size = 0;
    cache = Object.create(null);
    if (debug) {
        hitCount = 0;
        missCount = 0;
    }
};

exports.get = function (key, callback = () => {}) {
    let data = cache[key];
    if (typeof data != "undefined") {
        if (isNaN(data.expire) || data.expire >= Date.now()) {
            if (debug) hitCount++;
            callback(data.value);
        } else {
            // free some space
            if (debug) missCount++;
            size--;
            delete cache[key];
        }
    } else {
        if (debug) {
            missCount++;
        }
        callback(null);
    }
};

exports.size = function () {
    return size;
};

exports.memsize = function () {
    let size = 0,
        key;
    for (key in cache) {
        size++;
    }
    return size;
};

exports.debug = function (bool) {
    debug = bool;
};

exports.hits = function () {
    return hitCount;
};

exports.misses = function () {
    return missCount;
};

exports.keys = function () {
    return Object.keys(cache);
};