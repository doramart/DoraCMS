/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

// DO NOT EDIT THIS GENERATED OUTPUT DIRECTLY!
// This file should be overwritten as part of your build process.
// If you need to extend the behavior of the generated service worker, the best approach is to write
// additional code and include it using the importScripts option:
//   https://github.com/GoogleChrome/sw-precache#importscripts-arraystring
//
// Alternatively, it's possible to make changes to the underlying template file and then use that as the
// new base for generating output, via the templateFilePath option:
//   https://github.com/GoogleChrome/sw-precache#templatefilepath-string
//
// If you go that route, make sure that whenever you update your sw-precache dependency, you reconcile any
// changes made to this original template file with your modified copy.

// This generated service worker JavaScript will precache your site's resources.
// The code needs to be saved in a .js file at the top-level of your site, and registered
// from your pages in order to be used. See
// https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js
// for an example of how you can register this script and handle various service worker events.

/* eslint-env worker, serviceworker */
/* eslint-disable indent, no-unused-vars, no-multiple-empty-lines, max-nested-callbacks, space-before-function-paren, quotes, comma-spacing */
'use strict';

var precacheConfig = [["/static/css/admin.f20e7d2.css","fe0bb74a7e03864b89da2f6bd48d3758"],["/static/img/401.089007e.gif","089007e721e1f22809c0313b670a36f1"],["/static/img/404.a57b6f3.png","a57b6f31fa77c50f14d756711dea4158"],["/static/img/element-icons.6f0a763.ttf","6f0a76321d30f3c8120915e57f7bd77e"],["/static/js/0.199a386.js","324fd6d7737a90949c6b635a0fe32cba"],["/static/js/1.ab90ea9.js","41991b2282e6a8652e9f3f280f6277ec"],["/static/js/10.e1c5a3b.js","a1f15c6db769a03447fbb150f1130b93"],["/static/js/11.e68d017.js","2c2b319d9f8738a32992fbbea354ca05"],["/static/js/12.8c63839.js","8b99500f81aee65edc52d7fc0730bf09"],["/static/js/13.214e3b3.js","25c55bd8c42cb6256d9962f418460284"],["/static/js/14.955f503.js","8ada5394917525a3315b4b9c8e7604a5"],["/static/js/15.12b0350.js","2030cd431b363f627e312b0db421b2f0"],["/static/js/16.cfef722.js","6059470bdf71f717c90da4bd04a6cae5"],["/static/js/17.0c78c7e.js","e672d46895e4a4a47b3c90126db5fb45"],["/static/js/18.99faa30.js","20ce1165f110ff522f7842525ba24bcc"],["/static/js/19.96760fa.js","31bfab8313d26f143dfbd428b5778792"],["/static/js/2.41ddd89.js","e5ebce94849640f2d1c6aa6f44acba9a"],["/static/js/20.70badb2.js","fe23da357f06e49099b9502bc3d3cccf"],["/static/js/21.8143776.js","40340008e89b9309174890c9bf6c83f6"],["/static/js/22.689a311.js","08440e140ac024468f015e5496991157"],["/static/js/23.20b1095.js","a9559c846a2f086e08dfe0a8c1c73e56"],["/static/js/24.109b55b.js","a29b7fba3a9893d00f6243395af8147a"],["/static/js/25.0c76238.js","c1fba6141660f6575d2a61e8facd3cca"],["/static/js/26.be18a9a.js","97622849bfdeae7548cb7333fa6226bf"],["/static/js/27.d74bd1c.js","c545829f2fdc1dcfdb60c845732d8a71"],["/static/js/28.af29cf5.js","0a097ad4ff5ff00cb391a7da1f6d0f1e"],["/static/js/29.c332627.js","e4ace6bb6eaa11dc4ba76e1d2d818d6e"],["/static/js/3.809baa8.js","14376cd3f455772d39209dd5c9122bc3"],["/static/js/30.93f9607.js","bf2defaaec7b67b84c8afbe5b5290299"],["/static/js/31.472f0a5.js","651018ab0518e09c10156bfa8fc793e5"],["/static/js/32.adf9f00.js","70268bf9c5cacf36d1b81506a531cecd"],["/static/js/33.1e5d8aa.js","c0e6371de8211f2f372210961cacf351"],["/static/js/34.d8f44a9.js","7da8f049eea03254a951b5c8574a48ff"],["/static/js/35.f9a8cd2.js","775ead3d77199213124d172d7f2d10fe"],["/static/js/36.3bfb297.js","6554ea5ef630c1aa2be8a73727b35fad"],["/static/js/37.2bf8722.js","f250892bc4f85a5f84ce9727c0562d89"],["/static/js/38.086fcd0.js","5d990e0eaf5f862563060c0a58c08bf1"],["/static/js/39.8634c3e.js","7556198d736b1035b48ca7d773c7c788"],["/static/js/4.949bad3.js","18cbf55eb0f76165e9f15fc81fa4f546"],["/static/js/40.20affeb.js","593e68acc26661cce5f3e026c15a55fb"],["/static/js/41.1a3b1de.js","2821495a6b021ddb5045ce80db47ba3a"],["/static/js/42.52c205a.js","44982714eb1873d08c0d911ed8161c2a"],["/static/js/43.3bbfd65.js","201a67ce6c78de3d3f6bd4c5e697e400"],["/static/js/44.cae0c6d.js","b0745eca291fe6f62573aed9ddf5caf3"],["/static/js/45.3b10eef.js","2430c3016db9f15eddf33c8fcbf609b7"],["/static/js/46.60b8b2e.js","5af497b1e297e608cc381a8f97317477"],["/static/js/47.fa6159e.js","559c60ca9d3d0800b6b7870cfcde1f5b"],["/static/js/48.a311be2.js","8d503816d6aa28e8784b7980be1c715e"],["/static/js/49.dc9482b.js","e5b9d5fc5235c2d963f5e18e4fb52fb4"],["/static/js/5.fd81690.js","f21caf2aefcbe586cff9107e95ec9c6c"],["/static/js/50.5cc9fa6.js","7f0e17f3b45b09a3624fe8c10325e1de"],["/static/js/51.1e74aca.js","6dfd38820fb318c411e38e95863deb14"],["/static/js/52.d07e27e.js","ddc9e0e44c29fc499f9a3183cd526e53"],["/static/js/53.d07b1e4.js","e3c492db0da7319da3707ade2b0b1dbc"],["/static/js/54.7e2ea80.js","f248b5614836f70660d19e95b73b243d"],["/static/js/55.f92cef9.js","6d2e750a2802a924d679947f84c9aa4f"],["/static/js/56.63b9cfb.js","5d81713bba42c11f8e3197be8d6d9339"],["/static/js/57.9c87925.js","3b67492490367af23425cf36274354cf"],["/static/js/58.9ab5b10.js","b1b82cf71bbf4eccd91e8f8c57afbd37"],["/static/js/59.cc6aa3b.js","c35b9c3359cce86465e10da930f641d4"],["/static/js/6.f4b8395.js","41753e704fda093d73ba7a651043084f"],["/static/js/60.cb6be4a.js","d053574237700fe968cff184262987a1"],["/static/js/7.c86c42b.js","7863de4a3cd1ded6ef0fcb50586db0ed"],["/static/js/8.71caf4f.js","c57f99c399eed09c29a30fe24a8c8853"],["/static/js/9.0f2595b.js","ecf6306e92e89c0682d8829bc68e063e"],["/static/js/admin.4450d8a.js","910feaf11401cc44362d17724fa76770"],["/static/js/element.6ab292a.js","fcaceb41c97ef9b1d2064882e605093f"],["/static/js/manifest.2652b7d.js","0fa92cbc4dabef9a8cbf685147fc5e96"],["/static/js/vendor.4423a49.js","08223963190fd0d69cb3f01e6067bab6"]];
var cacheName = 'sw-precache-v3-doracms-vue2-ssr-' + (self.registration ? self.registration.scope : '');


var ignoreUrlParametersMatching = [/^utm_/];



var addDirectoryIndex = function(originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
      url.pathname += index;
    }
    return url.toString();
  };

var cleanResponse = function(originalResponse) {
    // If this is not a redirected response, then we don't have to do anything.
    if (!originalResponse.redirected) {
      return Promise.resolve(originalResponse);
    }

    // Firefox 50 and below doesn't support the Response.body stream, so we may
    // need to read the entire body to memory as a Blob.
    var bodyPromise = 'body' in originalResponse ?
      Promise.resolve(originalResponse.body) :
      originalResponse.blob();

    return bodyPromise.then(function(body) {
      // new Response() is happy when passed either a stream or a Blob.
      return new Response(body, {
        headers: originalResponse.headers,
        status: originalResponse.status,
        statusText: originalResponse.statusText
      });
    });
  };

var createCacheKey = function(originalUrl, paramName, paramValue,
                           dontCacheBustUrlsMatching) {
    // Create a new URL object to avoid modifying originalUrl.
    var url = new URL(originalUrl);

    // If dontCacheBustUrlsMatching is not set, or if we don't have a match,
    // then add in the extra cache-busting URL parameter.
    if (!dontCacheBustUrlsMatching ||
        !(url.pathname.match(dontCacheBustUrlsMatching))) {
      url.search += (url.search ? '&' : '') +
        encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
    }

    return url.toString();
  };

var isPathWhitelisted = function(whitelist, absoluteUrlString) {
    // If the whitelist is empty, then consider all URLs to be whitelisted.
    if (whitelist.length === 0) {
      return true;
    }

    // Otherwise compare each path regex to the path of the URL passed in.
    var path = (new URL(absoluteUrlString)).pathname;
    return whitelist.some(function(whitelistedPathRegex) {
      return path.match(whitelistedPathRegex);
    });
  };

var stripIgnoredUrlParameters = function(originalUrl,
    ignoreUrlParametersMatching) {
    var url = new URL(originalUrl);
    // Remove the hash; see https://github.com/GoogleChrome/sw-precache/issues/290
    url.hash = '';

    url.search = url.search.slice(1) // Exclude initial '?'
      .split('&') // Split into an array of 'key=value' strings
      .map(function(kv) {
        return kv.split('='); // Split each 'key=value' string into a [key, value] array
      })
      .filter(function(kv) {
        return ignoreUrlParametersMatching.every(function(ignoredRegex) {
          return !ignoredRegex.test(kv[0]); // Return true iff the key doesn't match any of the regexes.
        });
      })
      .map(function(kv) {
        return kv.join('='); // Join each [key, value] array into a 'key=value' string
      })
      .join('&'); // Join the array of 'key=value' strings into a string with '&' in between each

    return url.toString();
  };


var hashParamName = '_sw-precache';
var urlsToCacheKeys = new Map(
  precacheConfig.map(function(item) {
    var relativeUrl = item[0];
    var hash = item[1];
    var absoluteUrl = new URL(relativeUrl, self.location);
    var cacheKey = createCacheKey(absoluteUrl, hashParamName, hash, /./);
    return [absoluteUrl.toString(), cacheKey];
  })
);

function setOfCachedUrls(cache) {
  return cache.keys().then(function(requests) {
    return requests.map(function(request) {
      return request.url;
    });
  }).then(function(urls) {
    return new Set(urls);
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return setOfCachedUrls(cache).then(function(cachedUrls) {
        return Promise.all(
          Array.from(urlsToCacheKeys.values()).map(function(cacheKey) {
            // If we don't have a key matching url in the cache already, add it.
            if (!cachedUrls.has(cacheKey)) {
              var request = new Request(cacheKey, {credentials: 'same-origin'});
              return fetch(request).then(function(response) {
                // Bail out of installation unless we get back a 200 OK for
                // every request.
                if (!response.ok) {
                  throw new Error('Request for ' + cacheKey + ' returned a ' +
                    'response with status ' + response.status);
                }

                return cleanResponse(response).then(function(responseToCache) {
                  return cache.put(cacheKey, responseToCache);
                });
              });
            }
          })
        );
      });
    }).then(function() {
      
      // Force the SW to transition from installing -> active state
      return self.skipWaiting();
      
    })
  );
});

self.addEventListener('activate', function(event) {
  var setOfExpectedUrls = new Set(urlsToCacheKeys.values());

  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.keys().then(function(existingRequests) {
        return Promise.all(
          existingRequests.map(function(existingRequest) {
            if (!setOfExpectedUrls.has(existingRequest.url)) {
              return cache.delete(existingRequest);
            }
          })
        );
      });
    }).then(function() {
      
      return self.clients.claim();
      
    })
  );
});


self.addEventListener('fetch', function(event) {
  if (event.request.method === 'GET') {
    // Should we call event.respondWith() inside this fetch event handler?
    // This needs to be determined synchronously, which will give other fetch
    // handlers a chance to handle the request if need be.
    var shouldRespond;

    // First, remove all the ignored parameters and hash fragment, and see if we
    // have that URL in our cache. If so, great! shouldRespond will be true.
    var url = stripIgnoredUrlParameters(event.request.url, ignoreUrlParametersMatching);
    shouldRespond = urlsToCacheKeys.has(url);

    // If shouldRespond is false, check again, this time with 'index.html'
    // (or whatever the directoryIndex option is set to) at the end.
    var directoryIndex = 'index.html';
    if (!shouldRespond && directoryIndex) {
      url = addDirectoryIndex(url, directoryIndex);
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond is still false, check to see if this is a navigation
    // request, and if so, whether the URL matches navigateFallbackWhitelist.
    var navigateFallback = '';
    if (!shouldRespond &&
        navigateFallback &&
        (event.request.mode === 'navigate') &&
        isPathWhitelisted([], event.request.url)) {
      url = new URL(navigateFallback, self.location).toString();
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond was set to true at any point, then call
    // event.respondWith(), using the appropriate cache key.
    if (shouldRespond) {
      event.respondWith(
        caches.open(cacheName).then(function(cache) {
          return cache.match(urlsToCacheKeys.get(url)).then(function(response) {
            if (response) {
              return response;
            }
            throw Error('The cached response that was expected is missing.');
          });
        }).catch(function(e) {
          // Fall back to just fetch()ing the request if some unexpected error
          // prevented the cached response from being valid.
          console.warn('Couldn\'t serve response for "%s" from cache: %O', event.request.url, e);
          return fetch(event.request);
        })
      );
    }
  }
});







