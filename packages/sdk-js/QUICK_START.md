# 快速开始指南

5 分钟快速上手 DoraCMS SDK！

## 📦 安装

```bash
npm install @doracms/sdk
```

## 🚀 第一个程序

### 步骤 1: 创建客户端

```typescript
import { DoraCMSClient } from '@doracms/sdk';

const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  version: 'v1',
});
```

### 步骤 2: 登录

```typescript
await client.auth.login({
  username: 'admin',
  password: 'password',
});

console.log('登录成功！');
```

### 步骤 3: 获取数据

```typescript
const contents = await client.content.list({
  page: 1,
  pageSize: 10,
});

console.log(`找到 ${contents.total} 条内容`);
contents.items.forEach(item => {
  console.log(`- ${item.title}`);
});
```

## 🎯 完整示例

```typescript
import { DoraCMSClient, APIError } from '@doracms/sdk';

async function main() {
  // 1. 创建客户端
  const client = new DoraCMSClient({
    apiUrl: 'http://localhost:8080',
    version: 'v1',
  });

  try {
    // 2. 登录
    await client.auth.login({
      username: 'admin',
      password: 'password',
    });
    console.log('✅ 登录成功');

    // 3. 获取内容列表
    const contents = await client.content.list({
      page: 1,
      pageSize: 5,
    });
    console.log(`✅ 找到 ${contents.total} 条内容`);

    // 4. 创建新内容
    const newContent = await client.content.create({
      title: '我的第一篇文章',
      discription: '这是一篇测试文章',
      comments: '文章内容...',
      sImg: 'https://example.com/image.jpg',
      categories: ['cat-1'],
      tags: ['tag-1'],
    });
    console.log(`✅ 创建成功，ID: ${newContent.id}`);

    // 5. 更新内容
    await client.content.update(newContent.id, {
      title: '更新后的标题',
    });
    console.log('✅ 更新成功');

    // 6. 删除内容
    await client.content.delete(newContent.id);
    console.log('✅ 删除成功');

    // 7. 登出
    await client.auth.logout();
    console.log('✅ 登出成功');

  } catch (error) {
    if (error instanceof APIError) {
      console.error('❌ API 错误:', error.message);
      console.error('   错误码:', error.code);
      console.error('   状态码:', error.statusCode);
    } else {
      console.error('❌ 未知错误:', error);
    }
  }
}

main();
```

## 🔐 使用 API Key

如果你有 API Key，可以跳过登录步骤：

```typescript
const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  version: 'v1',
});

// 直接调用 API，无需登录
const contents = await client.content.list();
```

## 🛡️ 错误处理

始终使用 try-catch 处理错误：

```typescript
import { APIError, ErrorType } from '@doracms/sdk';

try {
  const content = await client.content.get('content-id');
} catch (error) {
  if (error instanceof APIError) {
    // 根据错误类型处理
    switch (error.type) {
      case ErrorType.AUTH:
        console.log('需要重新登录');
        break;
      case ErrorType.NETWORK:
        console.log('网络连接失败');
        break;
      case ErrorType.SERVER:
        console.log('服务器错误');
        break;
      default:
        console.log('其他错误:', error.message);
    }
  }
}
```

## 🔁 启用自动重试

配置自动重试，提高可靠性：

```typescript
const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  version: 'v1',
  retry: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
  },
});
```

## 📚 下一步

- 查看 [完整文档](./README.md)
- 浏览 [示例代码](./examples/)
- 阅读 [API 参考](../../API_V1_ENDPOINTS_REFERENCE.md)

## 💡 常见问题

### Q: 如何获取 API Key？

A: 登录后台管理系统，在"API 密钥管理"页面创建。

### Q: Token 会自动刷新吗？

A: 是的，SDK 会自动管理 Token，包括刷新过期的 Token。

### Q: 支持哪些环境？

A: 支持浏览器和 Node.js 环境。

### Q: 如何调试？

A: 可以通过浏览器开发者工具或 Node.js 调试器查看网络请求。

## 🆘 需要帮助？

- 查看 [问题列表](https://github.com/doramart/DoraCMS/issues)
- 提交 [新问题](https://github.com/doramart/DoraCMS/issues/new)
- 加入社区讨论

---

Happy Coding! 🎉
