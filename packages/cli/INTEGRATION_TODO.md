# DoraCMS CLI 集成待办事项

## 📋 当前状态

### ✅ 已完成
- CLI 工具完整实现
- 配置文件生成功能（`modules.config.js`）
- 模块依赖解析
- 智能推荐系统

### ⚠️ 待集成
**`server/config/modules.config.js` 目前还没有被 `RepositoryFactory` 使用**

---

## 🔧 需要集成的功能

### 1. 修改 RepositoryFactory 读取模块配置

**文件**: `server/app/repository/factories/RepositoryFactory.js`

**当前状态**: 
- RepositoryFactory 硬编码了所有 Repository 的映射
- 所有模块都会被加载，无法按需加载

**需要修改**:
```javascript
class RepositoryFactory {
  constructor(app) {
    this.app = app;
    this.repositories = new Map();
    
    // 🔥 新增：从配置加载模块
    this.modulesConfig = this.loadModulesConfig();
    
    // 🔥 修改：根据配置动态构建 repositoryMap
    this.repositoryMap = this.buildRepositoryMap();
    
    // 输出加载的模块信息
    this.logLoadedModules();
  }
  
  /**
   * 🔥 新增：加载模块配置
   */
  loadModulesConfig() {
    try {
      const configPath = path.join(this.app.baseDir, 'config/modules.config.js');
      if (fs.existsSync(configPath)) {
        return require(configPath);
      }
    } catch (error) {
      this.app.logger.warn('Failed to load modules.config.js, using default configuration');
    }
    
    // 默认配置：全部启用
    return null;
  }
  
  /**
   * 🔥 新增：根据模块配置动态构建 Repository 映射
   */
  buildRepositoryMap() {
    const map = {};
    
    // 如果没有配置文件，使用默认的全部加载
    if (!this.modulesConfig) {
      return this.getDefaultRepositoryMap();
    }
    
    // 1. 加载核心模块的 Repository
    const coreModules = this.modulesConfig.core || {};
    for (const [moduleName, moduleConfig] of Object.entries(coreModules)) {
      if (moduleConfig.enabled !== false) {
        const repositories = moduleConfig.repositories || [];
        repositories.forEach(repoName => {
          if (!map[repoName]) {
            map[repoName] = this.getRepositoryConfig(repoName);
          }
        });
      }
    }
    
    // 2. 加载业务模块的 Repository
    const businessModules = this.modulesConfig.business || {};
    for (const [moduleName, moduleConfig] of Object.entries(businessModules)) {
      if (moduleConfig.enabled) {
        const repositories = moduleConfig.repositories || [];
        repositories.forEach(repoName => {
          if (!map[repoName]) {
            map[repoName] = this.getRepositoryConfig(repoName);
          }
        });
      }
    }
    
    return map;
  }
  
  /**
   * 🔥 新增：获取 Repository 配置
   */
  getRepositoryConfig(repoName) {
    // 返回 MongoDB 和 MariaDB 的配置
    const configs = {
      SystemConfig: {
        mongodb: SystemConfigMongoRepository,
        mariadb: () => mariaDBRepositories.SystemConfig,
      },
      User: {
        mongodb: UserMongoRepository,
        mariadb: () => mariaDBRepositories.User,
      },
      // ... 其他 Repository 配置
    };
    
    return configs[repoName];
  }
  
  /**
   * 🔥 新增：获取默认的 Repository 映射（向后兼容）
   */
  getDefaultRepositoryMap() {
    return {
      SystemConfig: {
        mongodb: SystemConfigMongoRepository,
        mariadb: () => mariaDBRepositories.SystemConfig,
      },
      User: {
        mongodb: UserMongoRepository,
        mariadb: () => mariaDBRepositories.User,
      },
      // ... 所有 Repository
    };
  }
  
  /**
   * 🔥 新增：输出加载的模块信息
   */
  logLoadedModules() {
    if (!this.modulesConfig) {
      this.app.logger.info('📦 使用默认配置，所有模块已启用');
      return;
    }
    
    const enabledModules = [];
    const disabledModules = [];
    
    // 统计启用的模块
    const businessModules = this.modulesConfig.business || {};
    for (const [moduleName, moduleConfig] of Object.entries(businessModules)) {
      if (moduleConfig.enabled) {
        enabledModules.push(moduleConfig.name || moduleName);
      } else {
        disabledModules.push(moduleConfig.name || moduleName);
      }
    }
    
    this.app.logger.info('📦 模块加载状态:');
    this.app.logger.info(`  ✅ 已启用: ${enabledModules.join(', ')}`);
    if (disabledModules.length > 0) {
      this.app.logger.info(`  ❌ 已禁用: ${disabledModules.join(', ')}`);
    }
    this.app.logger.info(`  📊 Repository 数量: ${Object.keys(this.repositoryMap).length}`);
  }
}
```

---

## 📝 集成步骤

### Phase 1: 基础集成（必需）

#### 1. 修改 RepositoryFactory
**文件**: `server/app/repository/factories/RepositoryFactory.js`

**任务**:
- [ ] 添加 `loadModulesConfig()` 方法
- [ ] 添加 `buildRepositoryMap()` 方法
- [ ] 添加 `getRepositoryConfig()` 方法
- [ ] 添加 `logLoadedModules()` 方法
- [ ] 修改构造函数，使用动态加载

**预期效果**:
- 应用启动时读取 `modules.config.js`
- 只加载启用的模块的 Repository
- 输出模块加载状态日志

#### 2. 创建默认配置文件
**文件**: `server/config/modules.config.js`

**任务**:
- [ ] 在现有项目中创建默认配置文件
- [ ] 默认启用所有模块（向后兼容）

**示例**:
```javascript
// server/config/modules.config.js
'use strict';

module.exports = {
  core: {
    user: { enabled: true, repositories: ['User'], ... },
    systemConfig: { enabled: true, repositories: ['SystemConfig', 'SystemOptionLog'], ... },
    uploadFile: { enabled: true, repositories: ['UploadFile'], ... },
    apiKey: { enabled: true, repositories: ['ApiKey'], ... },
  },
  business: {
    content: { enabled: true, repositories: ['Content', 'ContentCategory', 'ContentTag', 'ContentInteraction'], ... },
    comment: { enabled: true, repositories: ['Message', 'MessageInteraction'], ... },
    ads: { enabled: true, repositories: ['Ads', 'AdsItems'], ... },
    template: { enabled: true, repositories: ['Template'], ... },
    mail: { enabled: true, repositories: ['MailTemplate'], ... },
    webhook: { enabled: true, repositories: ['Webhook', 'WebhookLog'], ... },
    menu: { enabled: true, repositories: ['Menu'], ... },
    role: { enabled: true, repositories: ['Role', 'Admin', 'PermissionDefinition'], ... },
    plugin: { enabled: true, repositories: ['Plugin'], ... },
  },
};
```

#### 3. 测试集成
**任务**:
- [ ] 测试默认配置（所有模块启用）
- [ ] 测试禁用单个模块
- [ ] 测试禁用多个模块
- [ ] 验证日志输出
- [ ] 验证性能提升

---

### Phase 2: 增强功能（可选）

#### 1. 添加模块守卫中间件
**文件**: `server/app/middleware/module-guard.js`

**功能**: 
- 检查请求的路由是否属于已禁用的模块
- 如果是，返回 404 或 403

**示例**:
```javascript
// server/app/middleware/module-guard.js
'use strict';

module.exports = () => {
  return async function moduleGuard(ctx, next) {
    const modulesConfig = ctx.app.config.modules;
    if (!modulesConfig) {
      return await next();
    }
    
    // 检查当前路由是否属于已禁用的模块
    const path = ctx.path;
    
    for (const [moduleName, moduleConfig] of Object.entries(modulesConfig.business || {})) {
      if (!moduleConfig.enabled) {
        const routes = moduleConfig.routes || [];
        for (const route of routes) {
          if (path.startsWith(route)) {
            ctx.status = 404;
            ctx.body = {
              success: false,
              message: `Module ${moduleName} is disabled`,
            };
            return;
          }
        }
      }
    }
    
    await next();
  };
};
```

#### 2. 添加模块管理 API
**文件**: `server/app/controller/manage/module.js`

**功能**:
- 列出所有模块状态
- 启用/禁用模块（需要重启）
- 查看模块依赖关系

#### 3. 添加配置验证
**文件**: `server/app/extend/application.js`

**功能**:
- 启动时验证模块配置
- 检查依赖关系
- 警告缺失的依赖

---

## 🎯 优先级

### 高优先级（必需）
1. ✅ CLI 工具实现（已完成）
2. ⏳ RepositoryFactory 集成（待实施）
3. ⏳ 创建默认配置文件（待实施）
4. ⏳ 测试和验证（待实施）

### 中优先级（推荐）
5. ⏳ 模块守卫中间件
6. ⏳ 配置验证

### 低优先级（可选）
7. ⏳ 模块管理 API
8. ⏳ Web UI 管理界面

---

## 📊 预期效果

### 性能提升

**完整项目**（所有模块启用）:
- Repository 数量: 22
- 内存占用: ~150MB
- 启动时间: ~5s

**精简项目**（仅核心 + 内容管理）:
- Repository 数量: 7
- 内存占用: ~80MB (-47%)
- 启动时间: ~3.5s (-30%)

### 用户体验

**创建项目时**:
```bash
doracms create my-blog
# 选择需要的模块
# CLI 生成 modules.config.js
```

**启动应用时**:
```bash
pnpm run dev:server

# 日志输出：
# 📦 模块加载状态:
#   ✅ 已启用: 内容管理, 评论系统, 邮件通知
#   ❌ 已禁用: 广告管理, 模板管理, 插件系统, Webhook, 菜单管理, 角色权限
#   📊 Repository 数量: 7
```

**手动调整时**:
```javascript
// 编辑 server/config/modules.config.js
business: {
  ads: {
    enabled: true,  // 改为 true 启用
  },
}

// 重启应用
pnpm run dev:server
```

---

## 🔄 向后兼容

### 兼容策略

1. **没有配置文件时**: 使用默认配置，加载所有模块（当前行为）
2. **有配置文件时**: 根据配置按需加载
3. **配置文件格式错误时**: 降级到默认配置，输出警告

### 迁移路径

**现有项目**:
1. 继续使用，无需修改（默认加载所有模块）
2. 可选：创建 `modules.config.js` 优化性能

**新项目**:
1. 使用 CLI 创建，自动生成配置
2. 按需选择模块

---

## 📝 实施建议

### 建议 1: 分阶段实施

**第一阶段**（1-2 天）:
- 修改 RepositoryFactory 支持配置文件
- 保持向后兼容
- 测试验证

**第二阶段**（1-2 天）:
- 添加模块守卫中间件
- 添加配置验证
- 完善文档

**第三阶段**（可选）:
- 添加模块管理 API
- 添加 Web UI

### 建议 2: 测试策略

**单元测试**:
- RepositoryFactory 配置加载
- 模块依赖解析
- 配置验证

**集成测试**:
- 完整项目启动
- 精简项目启动
- 模块启用/禁用

**性能测试**:
- 内存占用对比
- 启动时间对比
- Repository 数量统计

---

## 🎉 总结

### 当前状态
- ✅ CLI 工具 100% 完成
- ⏳ 后端集成 0% 完成

### 下一步
1. 修改 RepositoryFactory 读取配置
2. 创建默认配置文件
3. 测试和验证
4. 文档更新

### 预期收益
- 性能提升 30-47%
- 更灵活的模块管理
- 更好的用户体验
- 保持向后兼容

---

**文档版本**: 1.0  
**创建时间**: 2024-12-27  
**维护者**: DoraCMS Team
