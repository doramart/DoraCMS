'use strict';

const dns = require('dns');
const http = require('http');
const https = require('https');
const net = require('net');

const blocked = new net.BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
])
  blocked.addSubnet(address, prefix, 'ipv4');

for (const [address, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
  ['2001::', 32],
  ['2001:db8::', 32],
  ['2002::', 16],
])
  blocked.addSubnet(address, prefix, 'ipv6');

function isPublicAddress(address) {
  const family = net.isIP(address);
  return family !== 0 && !address.toLowerCase().startsWith('::ffff:') && !blocked.check(address, `ipv${family}`);
}

function assertPublicUrl(value) {
  if (typeof value !== 'string') throw new Error('Invalid outbound URL');
  let url;
  try {
    url = new URL(value);
  } catch (_) {
    throw new Error('Invalid outbound URL');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname) {
    throw new Error('Invalid outbound URL');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(hostname) && !isPublicAddress(hostname)) {
    throw new Error('Private outbound address is not allowed');
  }
  return url;
}

function publicCurlOptions(value) {
  assertPublicUrl(value);
  if (process.env.URLLIB_ENABLE_PROXY) throw new Error('Proxy is not allowed for configured outbound URLs');
  return {
    checkAddress: isPublicAddress,
    enableProxy: false,
    followRedirect: false,
  };
}

function publicAxiosOptions(value) {
  const url = assertPublicUrl(value);
  const lookup = (hostname, options, callback) => {
    dns.lookup(hostname, options, (error, address, family) => {
      if (error) return callback(error);
      const addresses = Array.isArray(address) ? address.map(item => item.address) : [address];
      if (!addresses.every(isPublicAddress)) return callback(new Error('Private outbound address is not allowed'));
      callback(null, address, family);
    });
  };
  return {
    httpAgent: url.protocol === 'http:' ? new http.Agent({ lookup }) : undefined,
    httpsAgent: url.protocol === 'https:' ? new https.Agent({ lookup }) : undefined,
    maxRedirects: 0,
    proxy: false,
  };
}

module.exports = { assertPublicUrl, isPublicAddress, publicCurlOptions, publicAxiosOptions };
