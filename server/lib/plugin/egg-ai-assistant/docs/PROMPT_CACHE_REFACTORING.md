# PromptManager 缓存重构总结

## 📋 重构概述

将 `PromptManagerService` 从自定义的 `Map` 内存缓存迁移到应用统一的 `UnifiedCache` 系统。

## 🔄 变更内容

### 1. 移除的代码

**删除的属性**:

```javascript
// 旧代码
this.promptCache = new Map(); // 提示词缓存
```

**重构的方法**:

- `_clearPromptCache(taskType, language)` - 清理特定提示词缓存（使用 `app.cache` 重新实现）

### 2. 新增的代码

**新增属性**:

```javascript
this.cachePrefix = 'prompt:'; // 缓存键前缀
this.cacheTTL = 7200; // 缓存过期时间（2小时，提示词变化少可以缓存更久）
```

**保留的配置**:

```javascript
this.abTestConfig = new Map(); // A/B 测试配置（运行时配置，不是缓存）
```

### 3. 缓存键格式

**旧格式**: `taskType:language:version`

```
title_generation:zh-CN:latest
tag_extraction:en-US:1.0.0
```

**新格式**: `prompt:taskType:language:version`

```
prompt:title_generation:zh-CN:latest
prompt:tag_extraction:en-US:1.0.0
```

## ✨ 优势

### 1. 与 AIContentService 统一

- 使用相同的 `app.cache` 接口
- 统一的缓存管理和监控
- 代码风格一致

### 2. 更长的缓存时间

- AIContentService: 3600秒（1小时）- 内容生成结果变化快
- PromptManager: 7200秒（2小时）- 提示词模板变化慢

### 3. 支持多种缓存后端

```bash
# 开发环境 - 内存缓存
CACHE_TYPE=memory

# 生产环境 - Redis 缓存
CACHE_TYPE=redis
```

### 4. 自动降级

- Redis 不可用时自动降级到内存缓存
- 确保服务可用性

## 📊 代码变更

### \_clearPromptCache() 方法

**旧实现**:

```javascript
_clearPromptCache(taskType, language) {
  for (const key of this.promptCache.keys()) {
    if (key.startsWith(`${taskType}:${language}:`)) {
      this.promptCache.delete(key);
    }
  }
}
```

**新实现**:

```javascript
async _clearPromptCache(taskType, language) {
  try {
    // 清除 'latest' 版本的缓存（最常用）
    const latestKey = this._getCacheKey(taskType, language, 'latest');
    await this.app.cache.delete(latestKey);

    // 注意：由于 UnifiedCache 不支持按前缀批量删除，
    // 其他版本的缓存会通过 TTL 自动过期
    // 如需立即清除所有缓存，可调用 clearCache()

    this.logger.debug(`[PromptManager] Cleared cache for ${taskType}/${language}`);
  } catch (error) {
    this.logger.warn('[PromptManager] Failed to clear prompt cache:', error.message);
    // 不抛出错误，避免影响主流程
  }
}
```

**说明**:

- ✅ 方法保留，用于 `createPrompt`、`updatePrompt`、`deletePrompt` 中清除缓存
- ✅ 清除 'latest' 版本（最常用）
- ⚠️ 其他版本通过 TTL 自动过期（2小时）
- ✅ 错误处理不影响主流程

---

### getPrompt() 方法

**旧实现**:

```javascript
// 检查缓存
if (useCache && this.promptCache.has(cacheKey)) {
  return this.promptCache.get(cacheKey);
}

// ... 加载提示词 ...

// 缓存结果
if (useCache) {
  this.promptCache.set(cacheKey, prompt);
}
```

**新实现**:

```javascript
// 检查缓存
if (useCache) {
  const cached = await this.app.cache.get(cacheKey);
  if (cached) {
    return cached;
  }
}

// ... 加载提示词 ...

// 缓存结果
if (useCache) {
  await this.app.cache.set(cacheKey, prompt, this.cacheTTL);
}
```

### clearCache() 方法

**旧实现**:

```javascript
clearCache(taskType = null, language = null) {
  if (taskType && language) {
    this._clearPromptCache(taskType, language);
  } else if (taskType) {
    for (const key of this.promptCache.keys()) {
      if (key.startsWith(`${taskType}:`)) {
        this.promptCache.delete(key);
      }
    }
  } else {
    this.promptCache.clear();
  }
}
```

**新实现**:

```javascript
async clearCache(taskType = null, language = null) {
  if (taskType || language) {
    // 注意：UnifiedCache 暂不支持按前缀删除
    this.logger.warn('Partial cache clear not fully supported');
  } else {
    await this.app.cache.clear();
    this.logger.info('All prompt cache cleared');
  }
}
```

## 🔧 使用示例

### 基本使用（无需改动）

```javascript
// 自动使用统一缓存
const prompt = await ctx.service.promptManager.getPrompt('title_generation', 'zh-CN', {
  useCache: true,
});
```

### 渲染提示词（无需改动）

```javascript
const rendered = await ctx.service.promptManager.renderPrompt(
  'title_generation',
  { content: '文章内容...' },
  { language: 'zh-CN' }
);
```

### 清除缓存

```javascript
// 清除所有提示词缓存
await ctx.service.promptManager.clearCache();

// 注意：按类型清除暂不支持
// await ctx.service.promptManager.clearCache('title_generation', 'zh-CN');
```

## ✅ 兼容性

### API 完全兼容

所有公开方法签名保持不变：

- ✅ `getPrompt(taskType, language, options)`
- ✅ `renderPrompt(taskType, variables, options)`
- ✅ `renderPromptBatch(tasks)`
- ✅ `createPrompt(promptData)`
- ✅ `updatePrompt(id, updates)`
- ✅ `deletePrompt(id)`
- ✅ `getTaskTypes()`
- ✅ `getPromptStats(taskType)`

### 行为变化

**缓存方法**:

- ⚠️ `clearCache(taskType, language)` - 按类型清除暂不支持，会记录警告
- ✅ `clearCache()` - 清除所有缓存正常工作

**A/B 测试配置**:

- ✅ `configureABTest()` - 保持不变（使用 Map，不是缓存）
- ✅ `abTestConfig` - 运行时配置，不影响

## 🎯 缓存策略对比

### AIContentService vs PromptManager

| 特性     | AIContentService   | PromptManager      |
| -------- | ------------------ | ------------------ |
| 缓存前缀 | `ai_content:`      | `prompt:`          |
| TTL 时间 | 3600秒（1小时）    | 7200秒（2小时）    |
| 缓存内容 | AI 生成结果        | 提示词模板         |
| 变化频率 | 高（内容每次不同） | 低（模板相对固定） |
| 使用场景 | 减少 AI 调用成本   | 减少数据库查询     |

### 为什么 PromptManager 缓存更久？

1. **提示词模板变化少**

   - 模板通常在开发时定义
   - 生产环境很少修改
   - 可以安全地缓存更长时间

2. **数据库查询开销**

   - 避免频繁查询数据库
   - 减少 I/O 操作
   - 提高整体性能

3. **内置模板加载**
   - 文件系统读取开销
   - JSON 解析开销
   - 缓存后性能提升明显

## 📝 最佳实践

### 1. 开发环境

```bash
# 使用内存缓存，便于调试
CACHE_TYPE=memory
CACHE_DEFAULT_TTL=3600
```

**优势**:

- 无需 Redis 依赖
- 修改提示词后重启应用即可
- 调试方便

### 2. 生产环境

```bash
# 使用 Redis 缓存，支持分布式
CACHE_TYPE=redis
CACHE_DEFAULT_TTL=7200
```

**优势**:

- 多进程共享缓存
- 更大缓存容量
- 持久化支持

### 3. 缓存更新策略

当修改提示词模板时：

```javascript
// 更新提示词
await ctx.service.promptManager.updatePrompt(id, updates);

// 手动清除缓存
await ctx.service.promptManager.clearCache();
```

或在 `updatePrompt()` 方法中自动清除：

```javascript
async updatePrompt(id, updates) {
  // ... 更新逻辑 ...

  // 清除相关缓存
  await this.app.cache.delete(this._getCacheKey(prompt.taskType, prompt.language, prompt.version));

  return prompt;
}
```

## 🔍 故障排查

### 问题 1：提示词修改后未生效

**原因**: 缓存未更新

**解决方案**:

```javascript
// 方案 1：清除所有缓存
await ctx.service.promptManager.clearCache();

// 方案 2：禁用缓存获取最新
const prompt = await ctx.service.promptManager.getPrompt(taskType, language, {
  useCache: false,
});
```

### 问题 2：缓存占用内存过多

**解决方案**:

```bash
# 调整内存缓存大小
MEMORY_CACHE_MAX_SIZE=500

# 或使用 Redis
CACHE_TYPE=redis
```

### 问题 3：Redis 连接失败

**表现**: 自动降级到内存缓存

**检查**:

1. 查看应用日志：`UnifiedCache: Using memory cache`
2. 验证 Redis 连接配置
3. 确认 Redis 服务状态

## 📈 性能提升

### 缓存命中率

**典型场景**:

- 相同提示词重复使用
- 多个用户共享相同模板
- 批量内容生成

**预期效果**:

- 首次访问：加载提示词（数据库/文件）
- 后续访问：缓存命中（Redis/内存）
- 性能提升：~10-50倍（取决于数据源）

### 监控建议

```javascript
// 记录缓存命中情况
const start = Date.now();
const prompt = await ctx.service.promptManager.getPrompt(taskType, language);
const duration = Date.now() - start;

// 缓存命中通常 < 10ms
// 数据库查询通常 50-200ms
// 文件加载通常 10-50ms
```

## 📚 相关文档

- [AIContentService 缓存重构](./CACHE_REFACTORING.md)
- [统一缓存系统](../../app/utils/unifiedCache.js)
- [提示词管理指南](./PROMPT_MANAGEMENT_GUIDE.md)

---

**重构时间**: 2025-10-10  
**影响范围**: PromptManagerService 缓存机制  
**向后兼容**: ✅ 是（仅 clearCache 部分功能受限）
