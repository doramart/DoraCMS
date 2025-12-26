/**
 * 基础使用示例
 */

import { DoraCMSClient } from '@doracms/sdk';

// 创建客户端实例
const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  version: 'v1',
});

async function main() {
  try {
    console.log('客户端已创建');
    console.log('认证状态:', client.isAuthenticated());
    console.log('认证类型:', client.getAuthType());

    // 注意：auth 和 content 模块将在后续任务中实现
    // 以下代码暂时无法运行，仅作为示例

    /*
    // 1. 登录
    console.log('正在登录...');
    await client.auth.login({
      username: 'admin',
      password: 'password',
    });
    console.log('登录成功！');

    // 2. 获取内容列表
    console.log('获取内容列表...');
    const contents = await client.content.list({
      page: 1,
      pageSize: 10,
    });
    console.log(`找到 ${contents.total} 条内容`);

    // 3. 创建新内容
    console.log('创建新内容...');
    const newContent = await client.content.create({
      title: '测试内容',
      content: '这是一条测试内容',
    });
    console.log('内容创建成功:', newContent.id);

    // 4. 更新内容
    console.log('更新内容...');
    await client.content.update(newContent.id, {
      title: '更新后的标题',
    });
    console.log('内容更新成功');

    // 5. 删除内容
    console.log('删除内容...');
    await client.content.delete(newContent.id);
    console.log('内容删除成功');

    // 6. 登出
    console.log('登出...');
    await client.auth.logout();
    console.log('登出成功');
    */
  } catch (error) {
    console.error('发生错误:', error);
  }
}

main();
