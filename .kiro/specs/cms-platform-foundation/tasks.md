# Implementation Plan: CMS Platform Foundation

## Overview

本实施计划将 EggCMS 系统改造为应用底座平台，采用渐进式改造策略，分 4 个阶段实施。每个阶段都可独立验证，确保功能完整性。改造遵循"功能完整性优先、引入最佳实践、架构演进"的原则，特别注意 Repository 层的稳定性。

## Tasks

- [x] 1. Phase 1: API 标准化与文档化
- [x] 1.1 统一 API 响应格式
  - ✅ 创建统一响应格式工具类（server/app/utils/apiResponse.js）
  - ✅ 定义标准响应结构：{ status, data, message, timestamp, requestId }
  - ✅ 创建 requestId 中间件（server/app/middleware/requestId.js）
  - ✅ 更新 helper.js 的 renderSuccess/renderFail 使用新格式（向后兼容）
  - ✅ 更新 errorHandler 中间件使用统一响应格式
  - ✅ 在 config.default.js 中注册 requestId 中间件
  - 📝 现有 Controller 无需修改，通过 helper 方法自动使用新格式
  - _Requirements: 1.2, 2.2_

- [ ]* 1.2 编写 API 响应格式属性测试
  - **Property 1: API 响应标准化**
  - **Validates: Requirements 1.2, 2.2**
  - 使用 fast-check 生成随机 API 请求
  - 验证所有响应包含必需字段
  - 验证 Content-Type 为 application/json
  - _Requirements: 1.2, 2.2_

- [x] 1.3 实现 API 版本管理
  - ✅ 创建 API 版本中间件（server/app/middleware/apiVersion.js）
  - ✅ 支持 URL 路径版本（/api/v1/）和请求头版本（API-Version）
  - ✅ 在响应头中添加版本信息（API-Version, X-API-Version-Source）
  - ✅ 创建 v1 版本路由目录（server/app/router/api/v1.js）
  - ✅ 在 config.default.js 中配置版本管理参数
  - ✅ 编写 API 版本管理文档（server/docs/api-versioning.md）
  - 📝 v1 路由采用 RESTful 风格，与旧路由共存保持兼容
  - _Requirements: 1.3, 9.1, 9.4, 9.5_

- [ ]* 1.4 编写 API 版本兼容性属性测试
  - **Property 2: API 版本兼容性**
  - **Validates: Requirements 1.3, 9.2, 9.5**
  - 测试旧版本 API 继续可用
  - 测试版本指定方式（URL 和 Header）
  - _Requirements: 1.3, 9.2, 9.5_

- [x] 1.5 集成 Swagger/OpenAPI 文档
  - ✅ 安装 egg-swagger-doc 插件（添加到 server/package.json）
  - ✅ 配置 Swagger UI 路由（/swagger-ui.html）
  - ✅ 配置 OpenAPI 规范（/swagger-doc）
  - ✅ 为健康检查 API 添加 JSDoc 注释示例
  - ✅ 创建通用数据模型（server/app/contract/common.js）
  - ✅ 编写 Swagger 使用指南（server/docs/swagger-guide.md）
  - 📝 需要运行 `pnpm install` 安装依赖后才能使用
  - 📝 其他 Controller 可参考 health.js 添加注释
  - _Requirements: 1.1, 1.4_

- [x] 1.6 优化错误处理中间件
  - ✅ 增强现有 errorHandler 中间件
  - ✅ 统一错误码定义（server/app/constants/ErrorCodes.js）
  - ✅ 实现错误分类（认证错误、客户端错误、服务端错误、业务错误）
  - ✅ 添加请求追踪 ID（requestId）- 已在 Task 1.1 完成
  - ✅ 支持多种错误类型识别（BusinessError、参数验证、数据库、JWT）
  - ✅ 开发环境自动添加调试信息
  - _Requirements: 1.2_

- [x] 2. Phase 2: 多端认证系统增强
- [x] 2.1 验证现有 API Key 功能
  - ✅ 已存在：API Key Model（server/app/model/apiKey.js）
  - ✅ 已存在：API Key Service（server/app/service/apiKey.js）
  - ✅ 已存在：API Key Controller（server/app/controller/api/apiKey.js）
  - ✅ 已存在：authApiToken 中间件（server/app/middleware/authApiToken.js）
  - ✅ 已存在：速率限制中间件（server/app/middleware/rateLimit.js）
  - 验证 API Key 功能在 MongoDB 和 MariaDB 下都正常工作
  - 验证 API Key 认证流程（签名验证、权限检查、IP 白名单）
  - _Requirements: 3.2_

- [ ]* 2.2 编写 API Key 认证属性测试
  - **Property 3: 多端认证统一性**
  - **Validates: Requirements 3.1, 3.2, 3.4, 3.5**
  - 测试 JWT、API Key 认证
  - 测试认证失败返回正确错误码
  - 测试 API Key 签名验证
  - 测试 IP 白名单和速率限制
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 2.3 优化 API Key 文档
  - ✅ 在 Swagger 文档中添加 API Key 认证说明
  - ✅ 编写 API Key 使用指南（server/docs/api-key-guide.md）
  - ✅ 提供 API Key 签名生成示例代码（Node.js, Python, Java）
  - ✅ 为 API Key 相关的 8 个接口添加 Swagger 注释
  - _Requirements: 3.2_

- [ ] 2.4 集成 OAuth 2.0 支持（可选）
  - 安装 egg-passport 插件
  - 配置 OAuth 2.0 Provider（GitHub、Google）
  - 实现 OAuth 回调处理
  - 实现 Token 交换逻辑
  - _Requirements: 3.3_

- [x] 3. Checkpoint - 验证认证系统
- 验证现有 API Key 功能正常工作
- 验证 JWT 认证功能正常工作
- 验证 MongoDB 和 MariaDB 双数据库支持
- 测试 API Key 签名验证、权限检查、IP 白名单
- 运行所有认证相关测试，确保通过
- 询问用户是否有问题

- [-] 4. Phase 3: JavaScript/TypeScript SDK
- [x] 4.1 创建 SDK 项目结构
  - 在 packages/sdk-js 创建 SDK 项目
  - 配置 TypeScript 和构建工具（Rollup/Vite）
  - 配置 package.json（@doracms/sdk）
  - 设置 ESLint 和 Prettier
  - _Requirements: 4.1_

- [x] 4.2 实现 SDK 核心类
  - 实现 DoraCMSClient 主类
  - 实现配置管理（apiUrl, apiKey, token, version）
  - 实现 HTTP 客户端（基于 axios）
  - 实现请求/响应拦截器
  - _Requirements: 4.2_

- [ ] 4.3 实现认证模块
  - 实现 AuthModule（login, logout, refreshToken）
  - 实现 Token 自动管理和刷新
  - 实现 Token 存储（localStorage/sessionStorage）
  - _Requirements: 4.5_

- [ ]* 4.4 编写 SDK Token 管理属性测试
  - **Property 6: SDK Token 自动管理**
  - **Validates: Requirements 4.5**
  - 测试 Token 过期自动刷新
  - 测试 Token 存储和恢复
  - _Requirements: 4.5_

- [ ] 4.5 实现内容管理模块
  - 实现 ContentModule（list, get, create, update, delete）
  - 提供类型安全的方法签名
  - 实现分页和过滤参数
  - _Requirements: 4.3_

- [ ] 4.6 实现统一错误处理
  - 创建 APIError 错误类
  - 实现错误转换和包装
  - 实现自动重试机制（可配置）
  - _Requirements: 4.4_

- [ ]* 4.7 编写 SDK 错误处理属性测试
  - **Property 5: SDK 错误处理一致性**
  - **Validates: Requirements 4.4**
  - 模拟 API 错误响应
  - 验证 SDK 错误转换
  - _Requirements: 4.4_

- [ ] 4.8 生成 TypeScript 类型定义
  - 从 OpenAPI 规范生成类型定义
  - 导出所有公共接口和类型
  - 配置类型声明文件（.d.ts）
  - _Requirements: 4.7_

- [ ] 4.9 编写 SDK 文档和示例
  - 编写 README 和 API 文档
  - 创建使用示例（examples/）
  - 编写快速开始指南
  - _Requirements: 4.1_

- [ ] 5. Phase 3: 移动端 SDK（可选）
- [ ] 5.1 创建 React Native SDK
  - 在 packages/sdk-mobile-rn 创建项目
  - 基于 JS SDK 扩展移动端特性
  - 实现网络状态检测
  - 实现离线缓存（AsyncStorage）
  - _Requirements: 5.1, 5.4_

- [ ]* 5.2 编写移动端 SDK 重试属性测试
  - **Property 7: 移动端 SDK 重试机制**
  - **Validates: Requirements 5.3**
  - 模拟网络失败
  - 验证自动重试
  - _Requirements: 5.3_

- [ ] 5.3 创建 Flutter SDK（可选）
  - 在 packages/sdk-mobile-flutter 创建项目
  - 使用 Dart 实现 SDK
  - 实现 HTTP 客户端（dio）
  - 实现离线缓存（shared_preferences）
  - _Requirements: 5.2, 5.4_

- [ ] 6. Phase 3: CLI 脚手架工具
- [ ] 6.1 创建 CLI 项目结构
  - 在 packages/cli 创建 CLI 项目
  - 配置 Commander.js 和 Inquirer.js
  - 配置可执行文件（bin/doracms）
  - 设置 npm 发布配置
  - _Requirements: 6.1_

- [ ] 6.2 实现 create 命令
  - 实现项目创建命令（doracms create）
  - 支持交互式选择模板
  - 实现项目文件生成
  - 实现依赖自动安装
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 6.3 创建项目模板
  - 创建移动端模板（React Native、Flutter）
  - 创建 Web 模板（Vue 3、React）
  - 创建纯后端模板（Node.js）
  - 预集成 SDK 和示例代码
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 6.4 实现 generate 命令
  - 实现代码生成命令（doracms generate）
  - 支持生成 API 客户端代码
  - 支持生成数据模型
  - 从 OpenAPI 规范生成代码
  - _Requirements: 6.4, 7.1_

- [ ] 6.5 实现 deploy 命令（可选）
  - 实现部署命令（doracms deploy）
  - 支持 Docker 镜像构建
  - 支持多云平台部署（Vercel、AWS）
  - 提供部署状态和 URL
  - _Requirements: 6.5, 17.1, 17.2, 17.3_

- [ ] 7. Phase 4: Webhook 系统
- [ ] 7.1 创建 Webhook 数据模型
  - 定义 Webhook Model（server/app/model/webhook.js）
  - 定义 WebhookLog Model
  - 创建 Webhook Repository（使用现有 Repository 模式）
  - 添加数据库迁移脚本
  - _Requirements: 10.1_

- [ ] 7.2 实现 Webhook Service
  - 创建 Webhook Service（server/app/service/webhook.js）
  - 实现 Webhook 注册和管理
  - 实现事件触发逻辑
  - 使用 Redis 队列处理异步发送
  - _Requirements: 10.1, 10.2_

- [ ]* 7.3 编写 Webhook 可靠性属性测试
  - **Property 9: Webhook 可靠性**
  - **Validates: Requirements 10.2, 10.3**
  - 测试 Webhook 触发和发送
  - 测试失败重试机制
  - _Requirements: 10.2, 10.3_

- [ ] 7.4 实现 Webhook 签名验证
  - 实现 HMAC-SHA256 签名生成
  - 实现签名验证工具
  - 在 Webhook 请求中添加签名头
  - _Requirements: 10.4_

- [ ]* 7.5 编写 Webhook 签名属性测试
  - **Property 10: Webhook 签名验证**
  - **Validates: Requirements 10.4**
  - 测试签名生成和验证
  - _Requirements: 10.4_

- [ ] 7.6 在业务逻辑中集成 Webhook
  - 在 Content Service 中触发 content.created 事件
  - 在 User Service 中触发 user.registered 事件
  - 使用 try-catch 包裹，失败不影响业务
  - 记录 Webhook 触发日志
  - _Requirements: 10.2, 10.5_

- [ ] 7.7 实现 Webhook 管理接口
  - 创建 Webhook Controller（server/app/controller/manage/webhook.js）
  - 实现创建、查询、更新、删除 Webhook 接口
  - 实现 Webhook 日志查询接口
  - 实现手动重试接口
  - _Requirements: 10.1, 10.3_

- [ ] 8. Phase 4: 文件存储增强（可选）
- [ ] 8.1 实现多存储后端支持
  - 扩展现有文件上传服务
  - 支持本地存储、阿里云 OSS、七牛云
  - 实现存储后端配置和切换
  - _Requirements: 13.1_

- [ ]* 8.2 编写文件上传属性测试
  - **Property 14: 文件上传多后端支持**
  - **Validates: Requirements 13.1, 13.2**
  - 测试不同存储后端上传
  - 验证返回 URL 可访问
  - _Requirements: 13.1, 13.2_

- [ ] 8.3 实现私有文件访问控制
  - 实现签名 URL 生成
  - 实现签名验证中间件
  - 支持文件权限配置
  - _Requirements: 13.4_

- [ ]* 8.4 编写私有文件访问属性测试
  - **Property 15: 私有文件访问控制**
  - **Validates: Requirements 13.4**
  - 测试未授权访问被拒绝
  - 测试签名 URL 可访问
  - _Requirements: 13.4_

- [ ] 9. Phase 4: 监控与日志增强
- [ ] 9.1 增强访问日志记录
  - 扩展现有 accessLogger 中间件
  - 记录请求 ID、用户 ID、API 版本
  - 实现日志采样（高流量场景）
  - _Requirements: 15.1_

- [ ]* 9.2 编写访问日志属性测试
  - **Property 16: 访问日志完整性**
  - **Validates: Requirements 15.1**
  - 测试日志包含必需字段
  - _Requirements: 15.1_

- [ ] 9.3 增强错误日志记录
  - 扩展现有 errorLogger 中间件
  - 记录详细堆栈和上下文
  - 实现错误告警（邮件、钉钉）
  - _Requirements: 15.2_

- [ ]* 9.4 编写错误日志属性测试
  - **Property 17: 错误日志详细性**
  - **Validates: Requirements 15.2**
  - 触发错误，验证日志记录
  - _Requirements: 15.2_

- [ ] 9.5 实现监控面板（可选）
  - 创建监控数据收集服务
  - 实现监控 API 接口
  - 创建监控前端页面
  - 展示系统状态和性能指标
  - _Requirements: 15.4_

- [ ] 10. Phase 4: 性能优化
- [ ] 10.1 优化缓存策略
  - 分析现有缓存使用情况
  - 优化缓存键设计
  - 实现缓存预热
  - 实现缓存失效策略
  - _Requirements: 18.1_

- [ ]* 10.2 编写缓存一致性属性测试
  - **Property 19: 缓存一致性**
  - **Validates: Requirements 18.1**
  - 测试缓存命中和失效
  - _Requirements: 18.1_

- [ ] 10.3 优化分页查询
  - 实现游标分页（Cursor-based Pagination）
  - 优化大数据集查询
  - 添加分页参数验证
  - _Requirements: 18.2_

- [ ]* 10.4 编写分页数据属性测试
  - **Property 20: 分页数据完整性**
  - **Validates: Requirements 18.2**
  - 测试所有页面数据完整性
  - _Requirements: 18.2_

- [ ] 11. Phase 4: 安全加固
- [ ] 11.1 实现 CSRF 防护
  - 启用 CSRF Token 验证
  - 配置 CSRF 白名单
  - 实现 Token 生成和验证
  - _Requirements: 19.1_

- [ ]* 11.2 编写 CSRF 防护属性测试
  - **Property 21: CSRF 防护**
  - **Validates: Requirements 19.1**
  - 测试无效 Token 被拒绝
  - _Requirements: 19.1_

- [ ] 11.3 增强输入验证
  - 实现 XSS 过滤
  - 实现 SQL 注入防护
  - 使用现有 parameter 验证器
  - _Requirements: 19.2_

- [ ]* 11.4 编写输入验证属性测试
  - **Property 22: 输入验证与过滤**
  - **Validates: Requirements 19.2**
  - 测试恶意输入被过滤
  - _Requirements: 19.2_

- [ ] 11.5 实现速率限制
  - 创建速率限制中间件
  - 支持基于 IP 和用户的限制
  - 实现 IP 黑名单
  - _Requirements: 19.3_

- [ ]* 11.6 编写速率限制属性测试
  - **Property 23: 速率限制**
  - **Validates: Requirements 19.3**
  - 测试超限请求被拒绝
  - _Requirements: 19.3_

- [ ] 12. Final Checkpoint - 完整性验证
- 运行所有单元测试和属性测试
- 验证 MongoDB 和 MariaDB 双数据库
- 验证所有现有功能正常
- 验证 Repository 层未被破坏
- 性能测试和压力测试
- 生成测试覆盖率报告
- 询问用户是否有问题

## Notes

- 任务标记 `*` 的为可选任务（主要是测试相关），可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，便于追溯
- Checkpoint 任务用于阶段性验证，确保改造不破坏现有功能
- 属性测试任务明确标注了属性编号和验证的需求
- 所有数据访问必须通过 Repository 模式
- 特别注意 Repository 层的稳定性，避免破坏多数据库支持
