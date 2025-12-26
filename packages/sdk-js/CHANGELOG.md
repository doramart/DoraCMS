# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-26

### Added

#### 核心功能
- ✨ 初始版本发布
- ✨ 完整的 TypeScript 支持
- ✨ DoraCMSClient 主客户端类
- ✨ HTTPClient HTTP 请求封装

#### 认证模块
- ✨ JWT 认证支持
- ✨ API Key 认证支持（自动签名）
- ✨ 用户登录/登出功能
- ✨ Token 自动管理
- ✨ Token 刷新功能
- ✨ 多种 Token 存储方式（localStorage, sessionStorage, memory）

#### 内容管理模块
- ✨ 内容列表查询（支持分页和筛选）
- ✨ 单个内容获取
- ✨ 内容创建
- ✨ 内容更新
- ✨ 内容删除（单个和批量）

#### 错误处理
- ✨ 统一的 APIError 错误类
- ✨ 错误类型自动识别（NETWORK, AUTH, CLIENT, SERVER, BUSINESS, UNKNOWN）
- ✨ 错误判断方法（isNetworkError, isAuthError, isServerError, isClientError, isRetryable）
- ✨ 错误工厂方法（networkError, timeoutError）

#### 自动重试
- ✨ 智能重试机制
- ✨ 指数退避算法
- ✨ 可配置的重试策略
- ✨ 只重试幂等请求（GET）
- ✨ 自动识别可重试错误

#### 工具函数
- ✨ API Key 签名生成
- ✨ Nonce 生成
- ✨ Token 存储管理

#### 文档和示例
- 📚 完整的 README 文档
- 📚 API 参考文档
- 📚 基础使用示例
- 📚 API Key 认证示例
- 📚 错误处理示例

#### 测试
- ✅ 73 个单元测试
- ✅ 完整的测试覆盖
- ✅ 所有测试通过

### Technical Details

#### 依赖
- axios: ^1.6.0 - HTTP 客户端
- crypto-js: ^4.2.0 - 加密工具

#### 构建
- Vite: 构建工具
- TypeScript: 类型系统
- ESM + CJS 双格式输出

#### 包大小
- ESM: 18.08 kB (gzip: 4.67 kB)
- CJS: 9.89 kB (gzip: 3.14 kB)

### API 端点

所有 API 端点使用 v1 RESTful API：

#### 认证
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/refresh` - 刷新 Token
- `GET /api/v1/users/me` - 获取当前用户

#### 内容管理
- `GET /api/v1/content` - 获取内容列表
- `GET /api/v1/content/:id` - 获取单个内容
- `POST /api/v1/content` - 创建内容
- `PUT /api/v1/content/:id` - 更新内容
- `DELETE /api/v1/content/:id` - 删除内容
- `DELETE /api/v1/content` - 批量删除内容

### Breaking Changes

无（初始版本）

### Migration Guide

无（初始版本）

---

## [Unreleased]

### Planned Features

#### 短期计划
- [ ] 用户管理模块
- [ ] 文件上传模块
- [ ] 分类管理模块
- [ ] 标签管理模块

#### 中期计划
- [ ] Webhook 支持
- [ ] 实时通信（WebSocket）
- [ ] 批量操作优化
- [ ] 缓存策略

#### 长期计划
- [ ] 移动端 SDK（React Native）
- [ ] Flutter SDK
- [ ] CLI 工具
- [ ] 代码生成器

---

## Version History

- **0.1.0** (2024-12-26) - 初始版本发布

---

## Links

- [GitHub Repository](https://github.com/doramart/DoraCMS)
- [npm Package](https://www.npmjs.com/package/@doracms/sdk)
- [Documentation](../../API_V1_ENDPOINTS_REFERENCE.md)
- [Issues](https://github.com/doramart/DoraCMS/issues)
