/**
 * API Key 认证示例
 */

import { DoraCMSClient } from '@doracms/sdk';

// 使用 API Key 认证
const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  version: 'v1',
});

async function main() {
  try {
    console.log('客户端已创建（使用 API Key 认证）');
    console.log('认证状态:', client.isAuthenticated());
    console.log('认证类型:', client.getAuthType());

    // 使用 API Key 认证时，不需要登录
    // SDK 会自动在每个请求中添加签名

    // 注意：content 模块将在后续任务中实现
    // 以下代码暂时无法运行，仅作为示例

    /*
    // 直接调用 API
    console.log('获取内容列表...');
    const contents = await client.content.list({
      page: 1,
      pageSize: 10,
    });
    console.log(`找到 ${contents.total} 条内容`);

    // 创建内容
    console.log('创建新内容...');
    const newContent = await client.content.create({
      title: 'API Key 测试内容',
      content: '使用 API Key 认证创建的内容',
    });
    console.log('内容创建成功:', newContent.id);
    */
  } catch (error) {
    console.error('发生错误:', error);
  }
}

main();
