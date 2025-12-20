/**
 * qiankun 微前端工具函数
 */

import { start } from 'qiankun';

let isQiankunStarted = false;

/**
 * 启动 qiankun 微前端框架
 */
export function startQiankun() {
  if (isQiankunStarted) {
    return;
  }

  try {
    start({
      prefetch: false, // 生产环境禁用预加载，避免资源加载问题
      sandbox: {
        strictStyleIsolation: false, // 禁用严格样式隔离，避免样式问题
        experimentalStyleIsolation: false // 禁用实验性样式隔离
      },
      singular: false // 允许多个子应用同时存在
    });

    isQiankunStarted = true;
  } catch (error) {
    console.error('Failed to start qiankun:', error);
  }
}

/**
 * 检查 qiankun 是否已启动
 */
export function isQiankunReady() {
  return isQiankunStarted;
}

/**
 * 等待 qiankun 启动完成
 */
export function waitForQiankun(timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isQiankunStarted) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isQiankunStarted) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('Qiankun startup timeout'));
      }
    }, 100);
  });
}
