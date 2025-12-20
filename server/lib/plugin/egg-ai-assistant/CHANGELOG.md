# Changelog

All notable changes to the egg-ai-assistant plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-21

### Added - 豆包文生图功能

#### 核心功能

- ✨ 新增豆包 (Doubao) SeeDream 3.0 文生图模型支持
- ✨ 新增豆包 (Doubao) SeeDream 4.0 文生图模型支持
- ✨ 新增图片生成服务 (`imageGenerationService.js`)
- ✨ 新增图片生成控制器 (`imageGeneration.js`)
- ✨ 新增豆包适配器 (`DoubaoAdapter.js`)

#### API 接口 (12个)

- ✨ `POST /api/ai/image/generate` - 生成单张或多张图片
- ✨ `POST /api/ai/image/batch-generate` - 批量生成图片
- ✨ `GET /api/ai/image/models` - 获取图片生成模型列表
- ✨ `GET /api/ai/image/sizes/:modelId` - 获取模型支持的尺寸
- ✨ `GET /api/ai/image/capabilities` - 获取图片生成能力说明
- ✨ `GET /api/ai/image/examples` - 获取示例提示词
- ✨ 管理端相同路径的 6 个接口 (`/manage/ai/image/*`)

#### 功能特性

- ✨ 支持多种图片尺寸 (1024x1024, 2K, 4K, 1280x720, 720x1280)
- ✨ 支持批量图片生成
- ✨ 支持自动模型选择
- ✨ 完整的使用日志记录
- ✨ 实时成本统计
- ✨ 模型健康检查
- ✨ 响应格式选择 (URL / Base64)
- ✨ 水印控制
- ✨ 指导比例调节 (SeeDream 3.0)
- ✨ 流式生成支持 (SeeDream 4.0)

#### 提示词优化

- ✨ 新增图片生成提示词优化模板 (中文/英文)
- ✨ 提供丰富的示例提示词库
- ✨ 提示词最佳实践文档

#### 前端支持

- ✨ 新增完整的前端演示页面 (`client/remote-page/ai-image-generation/`)
- ✨ 现代化的 UI 设计
- ✨ 响应式布局
- ✨ 图片下载和链接复制功能
- ✨ 实时统计信息展示

#### 文档

- 📝 新增豆包文生图使用指南 (`DOUBAO_IMAGE_GENERATION.md`)
- 📝 新增集成总结文档 (`DOUBAO_INTEGRATION_SUMMARY.md`)
- 📝 新增实现报告 (`DOUBAO_IMAGE_GENERATION_IMPLEMENTATION.md`)
- 📝 新增前端页面使用文档
- 📝 新增 CHANGELOG.md

### Changed - 系统改进

#### 数据模型

- 🔧 MongoDB AIModel Schema: 在 provider 枚举中添加 'doubao'
- 🔧 MariaDB AIModel Schema: 在 provider 枚举中添加 'doubao'

#### 服务层

- 🔧 aiModelManager: 添加 DoubaoAdapter 创建逻辑

#### 路由

- 🔧 API 路由: 添加图片生成相关路由
- 🔧 管理端路由: 添加图片生成相关路由

#### 初始化数据

- 🔧 default-models.json: 添加豆包 SeeDream 3.0 和 4.0 配置

### Technical Details - 技术细节

#### 新增文件 (11个)

```
lib/adapters/doubao/DoubaoAdapter.js
app/service/imageGenerationService.js
app/controller/imageGeneration.js
config/prompts/image_prompt_optimization.zh-CN.json
config/prompts/image_prompt_optimization.en-US.json
docs/DOUBAO_IMAGE_GENERATION.md
DOUBAO_INTEGRATION_SUMMARY.md
CHANGELOG.md
```

#### 修改文件 (6个)

```
app/model/aiModel.js
app/repository/schemas/mariadb/AIModelSchema.js
app/service/aiModelManager.js
app/router/api/ai.js
app/router/manage/ai.js
migrations/seed/default-models.json
```

#### 代码量统计

- 新增代码: ~3,000 行
- 修改代码: ~150 行
- 文档: ~2,000 行
- 总计: ~5,150 行

#### 架构改进

- 采用适配器模式统一不同 AI 提供商接口
- 完整的分层架构设计
- Repository 模式支持双数据库
- 工厂模式动态创建适配器

### Performance - 性能

- ⚡ 支持并发批量生成
- ⚡ 完整的错误重试机制
- ⚡ 模型健康状态监控
- ⚡ 使用统计实时更新

### Security - 安全

- 🔒 API Key 加密存储
- 🔒 完整的参数验证
- 🔒 支持访问权限控制
- 🔒 详细的审计日志

### Documentation - 文档

- 📖 完整的 API 文档
- 📖 详细的使用指南
- 📖 前端集成示例
- 📖 最佳实践建议

### Breaking Changes - 破坏性变更

无破坏性变更，完全向后兼容。

### Migration Guide - 迁移指南

如果您是从旧版本升级：

1. **数据库迁移**: 无需手动操作，插件启动时自动处理
2. **配置更新**: 无需更改现有配置
3. **API 兼容**: 所有现有 API 保持不变
4. **新功能启用**:

   ```bash
   # 1. 配置环境变量
   export ARK_API_KEY="your_api_key"

   # 2. 启动应用（自动初始化豆包模型）
   npm start

   # 3. 在管理后台启用豆包模型
   ```

### Dependencies - 依赖

无新增依赖，使用现有依赖：

- `lodash`: ^4.17.21 (已有)
- `egg`: ^2.0.0 || ^3.0.0 (已有)

### Tested Environments - 测试环境

- ✅ Node.js: 14.0.0+
- ✅ MongoDB: 4.0+
- ✅ MariaDB: 10.3+
- ✅ 浏览器: Chrome 90+, Firefox 88+, Safari 14+

### Known Issues - 已知问题

无已知问题。

### Contributors - 贡献者

- DoraCMS Team

---

## [1.0.0] - 2025-01-10

### Added - 初始版本

- 🎉 egg-ai-assistant 插件初始发布
- ✨ 支持 OpenAI, DeepSeek, Ollama 模型
- ✨ 文本生成功能
- ✨ 内容发布功能
- ✨ 提示词管理
- ✨ MongoDB & MariaDB 双数据库支持
- 📝 完整的文档和示例

---

## Links

- [豆包文生图使用指南](./docs/DOUBAO_IMAGE_GENERATION.md)
- [集成总结文档](./DOUBAO_INTEGRATION_SUMMARY.md)
- [实现报告](../../DOUBAO_IMAGE_GENERATION_IMPLEMENTATION.md)
- [项目主页](https://github.com/doramart/egg-ai-assistant)

---

**Note**: 本 CHANGELOG 遵循 [Keep a Changelog](https://keepachangelog.com/) 规范。
