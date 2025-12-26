/**
 * 错误处理和重试示例
 */

import { DoraCMSClient, APIError, ErrorType } from '@doracms/sdk';

// 创建客户端实例，配置重试策略
const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  version: 'v1',
  retry: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },
});

async function main() {
  try {
    // 示例 1: 基本错误处理
    console.log('=== 示例 1: 基本错误处理 ===');
    try {
      const content = await client.content.get('invalid-id');
      console.log('内容:', content);
    } catch (error) {
      if (error instanceof APIError) {
        console.error('API 错误:');
        console.error('  消息:', error.message);
        console.error('  错误码:', error.code);
        console.error('  状态码:', error.statusCode);
        console.error('  请求ID:', error.requestId);
        console.error('  错误类型:', error.type);
      }
    }

    // 示例 2: 错误类型判断
    console.log('\n=== 示例 2: 错误类型判断 ===');
    try {
      await client.content.get('test-id');
    } catch (error) {
      if (error instanceof APIError) {
        if (error.isAuthError()) {
          console.log('认证错误，需要重新登录');
        } else if (error.isNetworkError()) {
          console.log('网络错误，请检查网络连接');
        } else if (error.isServerError()) {
          console.log('服务器错误，请稍后重试');
        } else if (error.isClientError()) {
          console.log('客户端错误，请检查请求参数');
        }
      }
    }

    // 示例 3: 可重试错误判断
    console.log('\n=== 示例 3: 可重试错误判断 ===');
    try {
      await client.content.list();
    } catch (error) {
      if (error instanceof APIError) {
        if (error.isRetryable()) {
          console.log('这是一个可重试的错误，SDK 会自动重试');
          console.log('重试配置:');
          console.log('  最大重试次数: 3');
          console.log('  重试延迟: 1000ms');
          console.log('  指数退避: 是');
        } else {
          console.log('这不是可重试的错误，不会自动重试');
        }
      }
    }

    // 示例 4: 自定义错误处理
    console.log('\n=== 示例 4: 自定义错误处理 ===');
    try {
      await client.content.create({
        title: '测试',
        discription: '测试',
        comments: '测试',
        sImg: 'test.jpg',
        categories: [],
        tags: [],
      });
    } catch (error) {
      if (error instanceof APIError) {
        // 根据错误类型执行不同的处理逻辑
        switch (error.type) {
          case ErrorType.AUTH:
            console.log('处理认证错误: 跳转到登录页');
            break;
          case ErrorType.NETWORK:
            console.log('处理网络错误: 显示离线提示');
            break;
          case ErrorType.SERVER:
            console.log('处理服务器错误: 显示错误提示，稍后重试');
            break;
          case ErrorType.CLIENT:
            console.log('处理客户端错误: 显示表单验证错误');
            if (error.details) {
              console.log('验证错误详情:', error.details);
            }
            break;
          case ErrorType.BUSINESS:
            console.log('处理业务错误: 显示业务提示');
            break;
          default:
            console.log('处理未知错误');
        }

        // 记录错误日志
        console.log('错误日志:', error.toJSON());
      }
    }

    // 示例 5: 禁用自动重试
    console.log('\n=== 示例 5: 禁用自动重试 ===');
    const clientWithoutRetry = new DoraCMSClient({
      apiUrl: 'http://localhost:8080',
      version: 'v1',
      retry: {
        enabled: false, // 禁用自动重试
      },
    });

    try {
      await clientWithoutRetry.content.list();
    } catch (error) {
      if (error instanceof APIError) {
        console.log('请求失败，未启用自动重试');
        console.log('错误:', error.message);
      }
    }

    // 示例 6: 自定义重试配置
    console.log('\n=== 示例 6: 自定义重试配置 ===');
    const clientWithCustomRetry = new DoraCMSClient({
      apiUrl: 'http://localhost:8080',
      version: 'v1',
      retry: {
        enabled: true,
        maxRetries: 5, // 最多重试 5 次
        retryDelay: 2000, // 初始延迟 2 秒
        exponentialBackoff: true, // 使用指数退避
        retryableStatusCodes: [408, 429, 500, 502, 503, 504], // 可重试的状态码
      },
    });

    try {
      await clientWithCustomRetry.content.list();
      console.log('请求成功（可能经过了多次重试）');
    } catch (error) {
      if (error instanceof APIError) {
        console.log('请求失败，已达到最大重试次数');
        console.log('错误:', error.message);
      }
    }

    // 示例 7: 错误恢复策略
    console.log('\n=== 示例 7: 错误恢复策略 ===');
    async function fetchContentWithFallback(id: string) {
      try {
        // 尝试获取内容
        return await client.content.get(id);
      } catch (error) {
        if (error instanceof APIError) {
          if (error.isNetworkError()) {
            // 网络错误：尝试从缓存获取
            console.log('网络错误，尝试从缓存获取...');
            // return getCachedContent(id);
          } else if (error.statusCode === 404) {
            // 内容不存在：返回默认内容
            console.log('内容不存在，返回默认内容');
            return null;
          } else if (error.isServerError()) {
            // 服务器错误：等待后重试
            console.log('服务器错误，等待 5 秒后重试...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            return await client.content.get(id);
          }
        }
        throw error;
      }
    }

    await fetchContentWithFallback('test-id');
  } catch (error) {
    console.error('发生未处理的错误:', error);
  }
}

main();
