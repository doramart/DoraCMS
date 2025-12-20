# AI 模型管理微应用

基于 Qiankun 的 AI 模型配置管理微前端应用。

## 功能特性

### ✅ 已实现功能

1. **模型列表管理**

   - 支持分页查询
   - 按提供商筛选（OpenAI、DeepSeek、Ollama、Anthropic）
   - 按启用状态筛选
   - 实时切换启用/禁用状态
   - 批量操作（启用、禁用、删除）

2. **模型配置**

   - 添加/编辑模型配置
   - 支持多种 AI 提供商
   - API Key 安全输入（密码框+显示切换）
   - API Key 实时测试
   - 高级配置（Temperature、Max Tokens、超时、重试）
   - 优先级设置（1-20）
   - 支持任务类型选择

3. **提供商支持**

   - OpenAI（GPT-4、GPT-3.5-turbo 等）
   - DeepSeek（低成本，中英文优秀）
   - Ollama（本地部署，完全免费）
   - Anthropic（Claude 系列）

4. **用户体验**
   - Element Plus 原生样式
   - 响应式设计
   - 实时反馈和验证
   - API Key 掩码显示
   - 操作确认提示

## 技术栈

- **框架**: Vue 3 + Composition API
- **UI 组件**: Element Plus
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **国际化**: Vue I18n
- **微前端**: Qiankun

## 目录结构

```
src/
├── api/                    # API 接口
│   └── aiModel.js         # AI 模型 API
├── components/            # 组件
│   └── ModelEditDialog.vue # 模型编辑对话框
├── views/                 # 页面
│   └── ModelList.vue      # 模型列表页面
├── router/                # 路由配置
├── utils/                 # 工具函数
│   └── request.js         # HTTP 请求封装
├── App.vue                # 根组件
└── main.js                # 入口文件
```

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 独立运行（非 Qiankun 环境）
# 访问 http://localhost:5174
```

### 作为微应用运行

在主应用中通过 Qiankun 加载：

```javascript
// 主应用配置
registerMicroApps([
  {
    name: 'ai-model-manage',
    entry: '//localhost:5174',
    container: '#subapp-container',
    activeRule: '/remote-page/ai-model-manage',
  },
]);
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## API 接口

所有 API 请求基于 `/manage/ai` 路径：

| 接口                             | 方法   | 说明           |
| -------------------------------- | ------ | -------------- |
| `/manage/ai/models`              | GET    | 获取模型列表   |
| `/manage/ai/models/:id`          | GET    | 获取单个模型   |
| `/manage/ai/models`              | POST   | 创建模型       |
| `/manage/ai/models/:id`          | PUT    | 更新模型       |
| `/manage/ai/models/:id`          | DELETE | 删除模型       |
| `/manage/ai/models/:id/toggle`   | PUT    | 切换启用状态   |
| `/manage/ai/test-api-key`        | POST   | 测试 API Key   |
| `/manage/ai/providers`           | GET    | 获取提供商列表 |
| `/manage/ai/models/batch-delete` | POST   | 批量删除       |

## 环境变量

```bash
# API 基础地址
VITE_API_BASE_URL=http://localhost:7001

# 应用标题
VITE_APP_TITLE=AI Model Manage

# Qiankun 端口
VITE_PORT=5174
```

## 代码规范

- 使用 Vue 3 Composition API (`<script setup>`)
- 遵循 Element Plus 设计规范
- 尽量使用 Element Plus 原生样式
- 组件命名采用 PascalCase
- 文件命名采用 kebab-case

## 最佳实践

### 1. API Key 安全

- 输入时使用密码框
- 显示时自动掩码
- 存储时后端加密
- 传输时使用 HTTPS

### 2. 用户体验

- 所有操作提供即时反馈
- 危险操作需要二次确认
- Loading 状态明确展示
- 错误信息清晰友好

### 3. 性能优化

- 使用虚拟滚动（大数据量）
- 懒加载和代码分割
- 合理使用缓存
- 防抖和节流

## 常见问题

### Q: 如何添加新的 AI 提供商？

1. 后端：在 `AIConfigController` 的 `getProviders()` 方法中添加新提供商信息
2. 前端：支持商列表会自动从后端获取，无需修改

### Q: API Key 测试失败怎么办？

1. 检查 API Key 是否正确
2. 检查 API 端点是否正确
3. 检查网络连接
4. 查看后端日志获取详细错误信息

### Q: 如何自定义优先级范围？

修改 `ModelEditDialog.vue` 中的 `el-slider` 组件的 `:min` 和 `:max` 属性。

## 更新日志

### v1.0.0 (2025-01-12)

- ✅ 实现模型列表管理
- ✅ 实现模型配置对话框
- ✅ 支持 4 种 AI 提供商
- ✅ API Key 安全管理
- ✅ 批量操作功能
- ✅ 完整的错误处理

## 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

- 项目主页: https://github.com/doramart/DoraCMS
- 问题反馈: https://github.com/doramart/DoraCMS/issues
