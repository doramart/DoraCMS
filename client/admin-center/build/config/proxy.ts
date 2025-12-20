import type { HttpProxy, ProxyOptions } from 'vite';
import { bgRed, bgYellow, green, lightBlue } from 'kolorist';
import { consola } from 'consola';
import { createServiceConfig } from '../../src/utils/service';

/**
 * Set http proxy
 *
 * @param env - The current env
 * @param enable - If enable http proxy
 */
export function createViteProxy(env: Env.ImportMeta, enable: boolean) {
  const isEnableHttpProxy = enable && env.VITE_HTTP_PROXY === 'Y';

  const isEnableProxyLog = env.VITE_PROXY_LOG === 'Y';
  const { baseURL, proxyPattern, other } = createServiceConfig(env);

  const proxy: Record<string, ProxyOptions> = {};

  // 添加微前端静态资源代理（始终启用，不依赖 HTTP_PROXY 设置）
  proxy['/static/remote-page'] = {
    target: 'http://localhost:8080',
    changeOrigin: true,
    configure: (_proxy: HttpProxy.Server, options: ProxyOptions) => {
      if (isEnableProxyLog) {
        _proxy.on('proxyReq', (_proxyReq, req, _res) => {
          const requestUrl = `${lightBlue('[microfrontend proxy]')}: ${bgYellow(` ${req.method} `)} ${green(
            `/static/remote-page${req.url}`
          )}`;
          const proxyUrl = `${lightBlue('[real request url]')}: ${green(`${options.target}${req.url}`)}`;
          consola.log(`${requestUrl}\n${proxyUrl}`);
        });
        _proxy.on('error', (_err, req, _res) => {
          consola.log(bgRed(`Microfrontend Proxy Error: ${req.method} `), green(`${options.target}${req.url}`));
        });
      }
    }
  };

  // 如果启用了 HTTP 代理，添加 API 代理
  if (isEnableHttpProxy) {
    Object.assign(proxy, createProxyItem({ baseURL, proxyPattern }, isEnableProxyLog));

    other.forEach(item => {
      Object.assign(proxy, createProxyItem(item, isEnableProxyLog));
    });
  }

  return proxy;
}

function createProxyItem(item: App.Service.ServiceConfigItem, enableLog: boolean) {
  const proxy: Record<string, ProxyOptions> = {};

  proxy[item.proxyPattern] = {
    target: item.baseURL,
    changeOrigin: true,
    configure: (_proxy: HttpProxy.Server, options: ProxyOptions) => {
      _proxy.on('proxyReq', (_proxyReq, req, _res) => {
        if (!enableLog) return;

        const requestUrl = `${lightBlue('[proxy url]')}: ${bgYellow(` ${req.method} `)} ${green(
          `${item.proxyPattern}${req.url}`
        )}`;

        const proxyUrl = `${lightBlue('[real request url]')}: ${green(`${options.target}${req.url}`)}`;

        consola.log(`${requestUrl}\n${proxyUrl}`);
      });
      _proxy.on('error', (_err, req, _res) => {
        if (!enableLog) return;
        consola.log(bgRed(`Error: ${req.method} `), green(`${options.target}${req.url}`));
      });
    },
    rewrite: path => path.replace(new RegExp(`^${item.proxyPattern}`), '')
  };

  return proxy;
}
