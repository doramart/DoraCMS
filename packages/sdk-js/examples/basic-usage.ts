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

    // 1. 登录
    console.log('\n正在登录...');
    const loginResult = await client.auth.login({
      username: 'admin',
      password: 'password',
    });
    console.log('登录成功！用户:', loginResult.userName);

    // 2. 获取当前用户信息
    console.log('\n获取当前用户信息...');
    const currentUser = await client.auth.getCurrentUser();
    console.log('当前用户:', currentUser.userName, currentUser.email);

    // 3. 检查登录状态
    console.log('\n检查登录状态...');
    console.log('是否已登录:', client.auth.isLoggedIn());

    // 4. 获取内容列表
    console.log('\n获取内容列表...');
    const contents = await client.content.list({
      page: 1,
      pageSize: 10,
    });
    console.log(`找到 ${contents.total} 条内容`);

    // 5. 创建新内容
    console.log('\n创建新内容...');
    const newContent = await client.content.create({
      title: '测试内容',
      content: '这是一条测试内容',
    });
    console.log('内容创建成功:', newContent.id);

    // 6. 更新内容
    console.log('\n更新内容...');
    await client.content.update(newContent.id, {
      title: '更新后的标题',
    });
    console.log('内容更新成功');

    // 7. 删除内容
    console.log('\n删除内容...');
    await client.content.delete(newContent.id);
    console.log('内容删除成功');

    // 8. 登出
    console.log('\n登出...');
    await client.auth.logout();
    console.log('登出成功');
    console.log('是否已登录:', client.auth.isLoggedIn());
  } catch (error) {
    console.error('发生错误:', error);
  }
}

main();
