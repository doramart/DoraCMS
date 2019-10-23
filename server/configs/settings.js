/*
 * @param  {[string]} session_secret   [session 密钥]
 * @param  {[string]} auth_cookie_name   [cookie 标识]
 * @param  {[number]} serverPort   [服务端口号]
 * @param  {[string]} lang   [默认语言]
 * @param  {[string]} languages   [支持语言]
 * @param  {[string]} encrypt_key   [密钥]
 * @param  {[string]} salt_aes_key   [可以解密]
 * @param  {[string]} salt_md5_key   [MD5的盐，用于加密密码]
 * @param  {[string]} encryptApp_key   [iv加密key]
 * @param  {[string]} encryptApp_vi   [iv加密密钥]
 * @param  {[string]} mongo_connection_uri   [mongodb连接信息]
 * @param  {[boolean]} openqn   [打开七牛]
 * @param  {[string]} accessKey   [七牛信息]
 * @param  {[string]} secretKey   [七牛信息]
 * @param  {[string]} bucket   [资源空间名称]
 * @param  {[string]} origin   [cdn域名]
 * @param  {[number]} fsizeLimit   [上传文件大小限制]
 * @param  {[boolean]} openRedis   [使用redis缓存]
 * @param  {[string]} redis_host   [redis主机ip]
 * @param  {[number]} redis_port   [redis端口]
 * @param  {[string]} redis_psd   [redis密码]
 * @param  {[number]} redis_db   [redis db]
 * @param  {[number]} redis_ttl   [超时时间]
 * @param  {[string]} doracms_api   [系统服务提供商]
 * @param  {[string]} system_log_path   [服务器日志保存目录]
 * @param  {[string]} upload_path   [文件上传路径]
 */




'use strict';

module.exports = {
  "session_secret": "doracms_secret",
  "auth_cookie_name": "doracms",
  "serverPort": 8080,
  "lang": "zh-CN",
  "languages": [
    "zh-CN",
    "zh-TW",
    "en"
  ],
  "encrypt_key": "dora",
  "salt_aes_key": "doracms_",
  "salt_md5_key": "dora",
  "encryptApp_key": "751f621ea5c8f930",
  "encryptApp_vi": "2624750004598718",
  "mongo_connection_uri": "mongodb://127.0.0.1:27017/doracms2",
  "openqn": false,
  "accessKey": "ZeS04ItPQVfTJIOgefn2wKC1_njJ62n4yB9ujo",
  "secretKey": "LKK2d1je3AuLrA5JKeRdmWKxKfdnaJqK2JMVm7",
  "bucket": "cmsupload",
  "origin": "https://cdn.html-js.cn",
  "fsizeLimit": 5242880,
  "openRedis": false,
  "redis_host": "127.0.0.1",
  "redis_port": 6379,
  "redis_psd": "hello123",
  "redis_db": 0,
  "redis_ttl": 12,
  "doracms_api": "http://api.html-js.cn",
  "system_log_path": "./logs/",
  "upload_path": "/home/doraData/uploadFiles/doracms2/upload"
}