# SDK 使用示例

本目录包含 @doracms/sdk 的使用示例。

## 示例列表

### 1. 基础使用 (`basic-usage.ts`)

演示如何使用 JWT 认证进行基本的 CRUD 操作：
- 登录/登出
- 获取内容列表
- 创建内容
- 更新内容
- 删除内容

### 2. API Key 认证 (`api-key-auth.ts`)

演示如何使用 API Key 认证：
- 配置 API Key 和 Secret
- 自动签名请求
- 调用 API

## 运行示例

```bash
# 安装依赖
pnpm install

# 使用 ts-node 运行示例
npx ts-node examples/basic-usage.ts
npx ts-node examples/api-key-auth.ts
```

## 注意事项

1. 运行示例前，请确保 DoraCMS 服务器正在运行
2. 修改示例中的 API URL、用户名、密码等配置
3. 某些示例需要有效的 API Key 和 Secret

## 更多示例

更多使用示例请参考：
- [主 README](../README.md)
- [API 文档](https://github.com/doramart/DoraCMS/tree/main/docs)
