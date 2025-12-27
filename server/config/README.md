# DoraCMS 配置文件说明

## modules.config.js

### 用途

定义系统中所有可用的模块及其启用状态，支持按需加载模块以优化性能。

### 配置结构

```javascript
module.exports = {
  // 核心模块（必需，不可禁用）
  core: {
    user: { enabled: true, repositories: [...], dependencies: [] },
    systemConfig: { enabled: true, repositories: [...], dependencies: [] },
    uploadFile: { enabled: true, repositories: [...], dependencies: [] },
    apiKey: { enabled: true, repositories: [...], dependencies: [] },
  },
  
  // 业务模块（可选，可以禁用）
  business: {
    content: { enabled: true, repositories: [...], dependencies: [...] },
    comment: { enabled: true, repositories: [...], dependencies: [...] },
    // ... 其他模块
  },
};
```

### 字段说明

- **enabled**: 是否启用该模块（true/false）
- **name**: 模块名称（用于日志显示）
- **description**: 模块描述
- **repositories**: 该模块包含的 Repository 列表
- **dependencies**: 该模块依赖的其他模块

### 使用示例

#### 1. 禁用单个模块

```javascript
business: {
  ads: {
    enabled: false,  // 禁用广告管理模块
    // ...
  },
}
```

#### 2. 禁用多个模块（精简配置）

```javascript
business: {
  content: { enabled: true, ... },   // ✅ 保留
  comment: { enabled: true, ... },   // ✅ 保留
  mail: { enabled: true, ... },      // ✅ 保留
  
  ads: { enabled: false, ... },      // ❌ 禁用
  template: { enabled: false, ... }, // ❌ 禁用
  webhook: { enabled: false, ... },  // ❌ 禁用
  menu: { enabled: false, ... },     // ❌ 禁用
  role: { enabled: false, ... },     // ❌ 禁用
  plugin: { enabled: false, ... },   // ❌ 禁用
}
```

#### 3. 删除配置文件

如果删除此文件，系统将自动使用默认配置（所有模块启用）。

### 启动日志

修改配置后重启应用，会看到模块加载状态：

```
📦 已加载模块配置文件: config/modules.config.js
📦 模块加载状态:
  ✅ 已启用: 内容管理, 评论系统, 邮件通知
  ❌ 已禁用: 广告管理, 模板管理, Webhook, 菜单管理, 角色权限, 插件系统
  📊 Repository 数量: 9
```

### 性能优化

禁用不需要的模块可以显著提升性能：

| 配置 | Repository 数量 | 预期内存 | 预期启动时间 |
|------|----------------|---------|-------------|
| 完整配置 | 22 | ~150MB | ~5s |
| 精简配置 | 9 | ~80MB | ~3.5s |
| 优化效果 | -59% | -47% | -30% |

### 注意事项

1. **核心模块不能禁用**: user, systemConfig, uploadFile, apiKey
2. **注意依赖关系**: 
   - comment 依赖 content
   - webhook 依赖 content
   - role 依赖 user
3. **修改后需要重启**: 配置不会热更新
4. **向后兼容**: 删除配置文件不会影响现有功能

### 模块依赖关系

```
核心模块:
  user ─────────┐
  systemConfig  │
  uploadFile ───┤
  apiKey ───────┘

业务模块:
  content ──┬─> user
            └─> uploadFile
  
  comment ──┬─> user
            └─> content
  
  webhook ──┬─> user
            └─> content
  
  role ─────> user
  
  ads ──────> (独立)
  template ─> (独立)
  mail ─────> (独立)
  menu ─────> (独立)
  plugin ───> (独立)
```

### 相关文档

- CLI 工具: `packages/cli/README.md`
- 集成文档: `MODULE_LOADING_INTEGRATION_COMPLETE.md`
- 完整总结: `CLI_AND_MODULE_LOADING_COMPLETE.md`
