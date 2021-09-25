/*
 * @Author: doramart
 * @Date: 2019-07-16 14:06:28
 * @Discription redis 数据库
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 21:22:50
 */
'use strict';
const redis = require('./redis');
const _ = require('lodash');

/**
 * 从cache中取出缓存
 * @param key 键
 * @param callback 回调函数
 */
const get = function (key, callback) {
  redis.get(key, function (err, data) {
    if (err) {
      return callback(err);
    }
    if (!data) {
      return callback();
    }

    data = JSON.parse(data);
    callback(data);
  });
};

exports.get = get;

/**
 * 将键值对数据缓存起来
 *
 * @param key  键
 * @param value 值
 * @param time 参数可选，毫秒为单位,切换为redis以秒为单位，除以1000
 * @param callback 回调函数
 */
const set = function (key, value, time, callback) {
  if (typeof time === 'function') {
    callback = time;
    time = null;
  }
  callback = callback || _.noop;
  value = JSON.stringify(value);
  if (!time) {
    redis.set(key, value, callback);
  } else {
    // 将毫秒单位转为秒
    redis.setex(key, parseInt(time / 1000), value, callback);
  }
};

exports.set = set;

const del = (key) => {
  if (key) {
    redis.del(key);
  }
};

exports.del = del;
