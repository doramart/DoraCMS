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

var precacheConfig = [["/static/css/admin.e2b2ee4.css","d7d651bb8ed4db729e28193db2385f53"],["/static/img/401.089007e.gif","089007e721e1f22809c0313b670a36f1"],["/static/img/404.a57b6f3.png","a57b6f31fa77c50f14d756711dea4158"],["/static/img/element-icons.535877f.woff","535877f50039c0cb49a6196a5b7517cd"],["/static/img/element-icons.732389d.ttf","732389ded34cb9c52dd88271f1345af9"],["/static/js/0.cdd41a8.js","bc1d092fbbd0d4f239a04822ebbfdc82"],["/static/js/1.b5726fd.js","8c384d6336b483899d4dca6f841e43ea"],["/static/js/10.74f779a.js","3e41634e7c3a5c585b26092f0ca16841"],["/static/js/11.015ef80.js","b4f343c8de08eab6cb972c3b4cd054f9"],["/static/js/12.d17babe.js","c27b04b2b5bca105317018121843373f"],["/static/js/13.c76db21.js","75743ba5db113c4c4a31c01ab1501d2f"],["/static/js/14.5525fb5.js","a7c3bf7c0e8e426757e0f63027de1e28"],["/static/js/15.dc11062.js","5d550d19f930fbb0abc614ea612a5f71"],["/static/js/16.f0bf978.js","a74821e752c12d08d7fb5068eb6ed3ba"],["/static/js/17.7d1084b.js","1208571b4940466a13d9ab843a3ac34d"],["/static/js/18.2a25957.js","346b0023a19d758a817d60104edaea4f"],["/static/js/19.b5b63ba.js","65d9d12fd793084ea1f34f1ef8510cf4"],["/static/js/2.1fee634.js","68336fcf1c135635c71ae0671483569b"],["/static/js/20.10dd680.js","a80531d3df32e600f5584ee9dd7d23b2"],["/static/js/21.d014381.js","d9ffc11401bac3421a8b99efdd4cf6d6"],["/static/js/22.99f7bf3.js","fc27da2976eda29dc6aab16ebceafd2a"],["/static/js/23.273af74.js","8665bd12570e6db63ad32d414453e5c6"],["/static/js/24.ce2798d.js","9730d593e651024a9d1dff4397866a70"],["/static/js/25.d6ee212.js","279af2b904ab741b856dfdc269ba39b3"],["/static/js/26.b8f9668.js","a639b3717b83db2f3898335bd93060d5"],["/static/js/27.df4d6be.js","fcf3bccabad3dc8c88df226ba69b6d80"],["/static/js/28.1825988.js","363ca9127e263d87c566c64ee612397e"],["/static/js/29.8a35f0c.js","ec3fd5b29c118593c33a880d272f14fd"],["/static/js/3.5ec7c3d.js","e4168b0dc6ff28f26f707c87ceb30a80"],["/static/js/30.4d88e87.js","07a13264788c1f9f76781aa496910ad1"],["/static/js/31.203727e.js","8c71b4bbbbac1f1485bf047749c5a495"],["/static/js/32.2b9fe56.js","d57d318c48868f4093941456b63ddf78"],["/static/js/33.6b4621a.js","72e4e3b04d7d17f8eeb5558ca9cc2999"],["/static/js/34.2cc8b4b.js","49bf877fdaf51f54dcdbbe85ff395615"],["/static/js/35.901da49.js","d283ac3585561bdae6b0457185ed7f97"],["/static/js/36.a28d124.js","1eaeb89479dc3e79271435733ea32eba"],["/static/js/37.e3a6198.js","05bfbeb5fd1f4811af0bd23905be1c5f"],["/static/js/38.1be2ee6.js","aec440e195425c1f46874c9115df952a"],["/static/js/39.ff34c94.js","63cfbad72641693f809ad92a95cfd6d6"],["/static/js/4.662a031.js","c9fe0e80ad93d516d333c25978b385f4"],["/static/js/40.a0ae6c6.js","4e8e821783398c2360ec15ec88479d95"],["/static/js/41.54ed757.js","ea4a06a70d81d437b9dbd724653c3d30"],["/static/js/42.85e4c45.js","d308a8779f853ce3fe237543a75fe914"],["/static/js/43.78a0140.js","e836f66b49fd46c7b35279920bf2f53b"],["/static/js/44.3f206a3.js","96bf2768d253e2056c27b16f1217cb66"],["/static/js/45.0edb249.js","51e2a227610f12e545964f7d6a665896"],["/static/js/46.b1e8216.js","0622cf43f844741f746886cc8576490e"],["/static/js/47.d7f7dd1.js","e4975a6439f3972b2379fcb5b4a9d0a5"],["/static/js/48.2c10094.js","2e6a0fb84c59756d67f434de13d95a41"],["/static/js/49.2c3a4b2.js","62ec3273ee5ee8cf7f635011ed5f5ce1"],["/static/js/5.37ee781.js","71371e6c8feb134ef1268f63b4585173"],["/static/js/50.fa05aa3.js","bafea067265a28f7657fb9ec114b184a"],["/static/js/51.0d03693.js","2bd00c1ad051f1fa02c21057cc54e3ce"],["/static/js/52.4e328ed.js","5e7ef26e78c3b0e6e1693d915ab5441d"],["/static/js/53.8ff17dc.js","3492478455eac406a550e013b6eb756e"],["/static/js/54.f42cfe6.js","785a994a717fc5f50b08e87f028df6e2"],["/static/js/55.f713889.js","65ac2d94d27ba68a8a65377aac82d9b1"],["/static/js/56.0b1d7d3.js","c8abafd4d09fc98ce55d6c0d95ea9f8a"],["/static/js/57.8c03f70.js","5662704840777146be42c1ec7d72de0b"],["/static/js/58.ded91df.js","c9f348ba692acf79f9a91f49f53043fc"],["/static/js/59.4e03c73.js","6d62c5d75625429dec56f4fb5e7e8f1d"],["/static/js/6.1dbb843.js","d866d663db44c97c5091789ad4ad4c01"],["/static/js/60.d35e7b5.js","06de5c89d485e3b636868fb3d9f2efdc"],["/static/js/61.2e00250.js","1b2463dcb2dc123ccbf6335c0df97f96"],["/static/js/62.5949124.js","d308ab9d4f4f0df55b56cc68c1bb93db"],["/static/js/63.6aefb8e.js","0333f63f30766fdd9a16a70560ca487d"],["/static/js/64.3388d0c.js","3d7a0d5cc6119f89465127f5dedf4fdb"],["/static/js/65.5bbd1e0.js","db4600042d884e8df91610fc64ed6c9e"],["/static/js/66.f8561f0.js","acfb711e8e246f9e02865dac0427d66f"],["/static/js/67.6606da5.js","55e0591e1723851060fedea83a2ff17d"],["/static/js/68.2ea9167.js","7e0904ba2258a98593d93fe5123d2c3d"],["/static/js/7.0d9343b.js","7734b5cb5d9313c614ea3dea2d56c540"],["/static/js/8.0231aa7.js","a144168a8226b6ca8476238b5c4a26d3"],["/static/js/9.110776a.js","344c865a66fb1f5f647ee2040026a530"],["/static/js/admin.3cd8926.js","1f44233be3963c1af8fe171f4bf4e258"],["/static/js/manifest.b29090d.js","e06e20faf7944881de90158e47e65965"]];
var cacheName = 'sw-precache-v3-doracms-vue2-ssr-' + (self.registration ? self.registration.scope : '');


var ignoreUrlParametersMatching = [/^utm_/];



var addDirectoryIndex = function (originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
      url.pathname += index;
    }
    return url.toString();
  };

var cleanResponse = function (originalResponse) {
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

var createCacheKey = function (originalUrl, paramName, paramValue,
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

var isPathWhitelisted = function (whitelist, absoluteUrlString) {
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

var stripIgnoredUrlParameters = function (originalUrl,
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







