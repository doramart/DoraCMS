# AI 内容服务使用指南

## 📋 概述

AIContentService 是统一的 AI 内容生成服务，集成了提示词管理、模型选择和 AI 适配器，提供了 6 个核心内容生成功能。

## 🏗️ 架构

```
AIContentService (统一服务层)
    ↓
PromptManager (提示词渲染)
    ↓
ModelSelector (模型选择)
    ↓
AI Adapters (AI 调用)
    ↓
AIModelManager (使用统计)
```

## 🚀 快速开始

### 基本使用

```javascript
// 在 Controller 或 Service 中
class YourController extends Controller {
  async createArticle() {
    const { content } = this.ctx.request.body;

    // 使用 AI 内容服务
    const aiContent = this.ctx.service.aiContentService;

    // 生成标题
    const titleResult = await aiContent.generateTitle(content);

    // 提取标签
    const tagsResult = await aiContent.extractTags(content);

    // 生成摘要
    const summaryResult = await aiContent.generateSummary(content);

    // 保存文章
    const article = await this.ctx.service.content.create({
      title: titleResult.title,
      tags: tagsResult.tags,
      summary: summaryResult.summary,
      content,
    });

    this.ctx.body = { success: true, article };
  }
}
```

## 📚 核心功能

### 1. 标题生成 (generateTitle)

从文章内容生成吸引人的标题。

**基本用法**:

```javascript
const result = await ctx.service.aiContentService.generateTitle(articleContent);

if (result.success) {
  console.log('标题:', result.title);
  console.log('提供商:', result.metadata.provider);
  console.log('成本:', result.metadata.cost);
}
```

**高级选项**:

```javascript
const result = await ctx.service.aiContentService.generateTitle(articleContent, {
  style: '专业', // 标题风格
  keywords: 'AI,技术', // 关键词
  language: 'zh-CN', // 语言
  useCache: true, // 使用缓存
  strategy: 'balanced', // 模型选择策略
});
```

**返回结果**:

```javascript
{
  success: true,
  title: "AI 革命：人工智能如何重塑现代生活",
  metadata: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    cost: 0.002,
    responseTime: 1200,
    language: "zh-CN"
  },
  fromCache: false  // 是否来自缓存
}
```

---

### 2. 标签提取 (extractTags)

从文章内容中智能提取相关标签。

**基本用法**:

```javascript
const result = await ctx.service.aiContentService.extractTags(articleContent);

if (result.success) {
  console.log('标签:', result.tags);
  // ['人工智能', 'AI技术', '智能化', '未来趋势']
}
```

**高级选项**:

```javascript
const result = await ctx.service.aiContentService.extractTags(articleContent, {
  maxTags: 5, // 最多提取 5 个标签
  category: '科技', // 文章类别
  language: 'zh-CN',
  useCache: true,
  strategy: 'cost_optimal', // 成本优先策略
});
```

**返回结果**:

```javascript
{
  success: true,
  tags: ["人工智能", "AI技术", "智能化", "机器学习", "未来趋势"],
  metadata: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    cost: 0.001,
    responseTime: 800,
    language: "zh-CN"
  }
}
```

---

### 3. 摘要生成 (generateSummary)

生成简洁准确的文章摘要。

**基本用法**:

```javascript
const result = await ctx.service.aiContentService.generateSummary(articleContent);

if (result.success) {
  console.log('摘要:', result.summary);
}
```

**高级选项**:

```javascript
const result = await ctx.service.aiContentService.generateSummary(articleContent, {
  maxLength: 200, // 最大长度
  style: '客观', // 摘要风格
  language: 'zh-CN',
  useCache: true,
  strategy: 'performance_optimal', // 性能优先
});
```

**返回结果**:

```javascript
{
  success: true,
  summary: "本文探讨了人工智能技术如何改变现代生活，从智能家居到自动驾驶，AI 正在重塑我们的日常体验。文章同时分析了 AI 发展带来的挑战和机遇。",
  metadata: {
    provider: "openai",
    model: "gpt-4",
    cost: 0.015,
    responseTime: 2000,
    language: "zh-CN"
  }
}
```

---

### 4. 分类匹配 (matchCategory)

智能匹配文章所属分类。

**基本用法**:

```javascript
const categories = [
  { name: '人工智能', description: 'AI 相关技术和应用' },
  { name: '科技新闻', description: '最新的科技动态' },
  { name: '编程开发', description: '编程语言和开发工具' },
];

const result = await ctx.service.aiContentService.matchCategory(articleContent, categories);

if (result.success) {
  console.log('匹配的分类:', result.categories);
  // ['人工智能', '科技新闻']
}
```

**返回结果**:

```javascript
{
  success: true,
  categories: ["人工智能", "科技新闻"],
  metadata: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    cost: 0.001,
    responseTime: 900,
    language: "zh-CN"
  }
}
```

---

### 5. SEO 优化 (optimizeSEO)

提供 SEO 优化建议。

**基本用法**:

```javascript
const result = await ctx.service.aiContentService.optimizeSEO('文章标题', articleContent);

if (result.success) {
  console.log('SEO 建议:', result.suggestions);
}
```

**高级选项**:

```javascript
const result = await ctx.service.aiContentService.optimizeSEO('文章标题', articleContent, {
  keywords: 'AI,人工智能,技术',
  language: 'zh-CN',
  useCache: true,
  strategy: 'balanced',
});
```

**返回结果**:

```javascript
{
  success: true,
  suggestions: {
    keywordDensity: "关键词密度适中，建议增加'人工智能'的使用频率",
    titleSuggestion: "建议在标题中包含主要关键词",
    metaDescription: "AI 技术正在改变世界，了解人工智能的最新发展趋势",
    linkSuggestions: "建议添加相关内链，增加外部权威链接",
    structureTips: "建议使用 H2/H3 标签优化内容结构",
    score: 75
  },
  metadata: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    cost: 0.003,
    responseTime: 1500,
    language: "zh-CN"
  }
}
```

---

### 6. 内容质量评估 (checkQuality)

全面评估文章内容质量。

**基本用法**:

```javascript
const result = await ctx.service.aiContentService.checkQuality('文章标题', articleContent);

if (result.success) {
  console.log('质量评分:', result.assessment.overallScore);
  console.log('改进建议:', result.assessment.improvements);
}
```

**返回结果**:

```javascript
{
  success: true,
  assessment: {
    originality: { score: 85, comment: "内容原创性强，观点独特" },
    structure: { score: 80, comment: "结构清晰，层次分明" },
    language: { score: 90, comment: "语言流畅，无明显错误" },
    depth: { score: 75, comment: "内容有一定深度，建议增加案例" },
    readability: { score: 88, comment: "易读性好，适合目标读者" },
    practicality: { score: 70, comment: "实用性中等，建议增加实操内容" },
    overallScore: 81,
    overallComment: "整体质量良好，建议在实用性方面加强",
    improvements: [
      "增加具体案例和数据支持",
      "添加实践操作指南",
      "优化段落长度，提高可读性"
    ]
  },
  metadata: {
    provider: "openai",
    model: "gpt-4",
    cost: 0.02,
    responseTime: 3000,
    language: "zh-CN"
  }
}
```

---

### 7. 批量生成 (generateBatch)

一次性生成标题、标签和摘要。

**基本用法**:

```javascript
const result = await ctx.service.aiContentService.generateBatch(articleContent);

console.log('标题:', result.title.title);
console.log('标签:', result.tags.tags);
console.log('摘要:', result.summary.summary);
```

**高级选项**:

```javascript
const result = await ctx.service.aiContentService.generateBatch(articleContent, {
  language: 'zh-CN',
  strategy: 'balanced',
  title: {
    style: '专业',
    keywords: 'AI,技术',
  },
  tags: {
    maxTags: 5,
    category: '科技',
  },
  summary: {
    maxLength: 200,
    style: '客观',
  },
});
```

**返回结果**:

```javascript
{
  success: true,
  title: {
    success: true,
    title: "AI 革命：重塑未来的智能技术",
    metadata: { ... }
  },
  tags: {
    success: true,
    tags: ["人工智能", "AI技术", "智能化", "未来"],
    metadata: { ... }
  },
  summary: {
    success: true,
    summary: "本文深入探讨了...",
    metadata: { ... }
  }
}
```

## 🎯 模型选择策略

AIContentService 支持 4 种模型选择策略：

### 1. cost_optimal（成本优先）

适用于批量处理，选择成本最低的模型。

```javascript
const result = await ctx.service.aiContentService.extractTags(content, {
  strategy: 'cost_optimal',
});
```

### 2. performance_optimal（性能优先）

适用于高质量要求，选择性能最好的模型。

```javascript
const result = await ctx.service.aiContentService.generateSummary(content, {
  strategy: 'performance_optimal',
});
```

### 3. balanced（平衡模式）⭐ 推荐

综合考虑成本和性能（默认策略）。

```javascript
const result = await ctx.service.aiContentService.generateTitle(content, {
  strategy: 'balanced',
});
```

### 4. priority（优先级模式）

按配置的优先级选择模型。

```javascript
const result = await ctx.service.aiContentService.checkQuality(title, content, {
  strategy: 'priority',
});
```

## 💾 缓存管理

### 统一缓存系统

AIContentService 使用应用统一的 `UnifiedCache` 系统，支持：

- ✅ 内存缓存（开发环境）
- ✅ Redis 缓存（生产环境推荐）
- ✅ 自动降级（Redis → Memory）
- ✅ TTL 过期管理

### 使用缓存

缓存可以显著提高性能并降低成本：

```javascript
// 启用缓存（默认）
const result = await ctx.service.aiContentService.generateTitle(content, {
  useCache: true,
});

// 禁用缓存
const result = await ctx.service.aiContentService.generateTitle(content, {
  useCache: false,
});
```

### 配置缓存

**环境变量**:

```bash
# 缓存类型
CACHE_TYPE=redis  # 或 memory

# 默认过期时间（秒）
CACHE_DEFAULT_TTL=3600

# 内存缓存最大条目数
MEMORY_CACHE_MAX_SIZE=1000
```

**配置文件**:

```javascript
// config/config.default.js
config.cache = {
  type: 'memory',
  defaultTTL: 3600,
  maxSize: 1000,
};

// 生产环境使用 Redis
// config/config.prod.js
config.cache = {
  type: 'redis',
  defaultTTL: 3600,
};
```

### 清除缓存

```javascript
// 清除所有 AI 内容缓存
await ctx.service.aiContentService.clearCache();

// 注意：按类型清除暂不支持
// await ctx.service.aiContentService.clearCache('title');
```

### 查看缓存统计

```javascript
const stats = ctx.service.aiContentService.getCacheStats();
console.log('缓存类型:', stats.type); // 'memory' 或 'redis'
console.log('TTL:', stats.ttl); // 3600
console.log('详细统计:', stats.stats);
// {
//   size: 15,
//   maxSize: 1000,
//   keys: ['ai_content:title:xxx', ...]
// }
```

### 缓存键格式

所有缓存键都有统一前缀：`ai_content:type:hash`

```
ai_content:title:abc123...
ai_content:tags:def456...
ai_content:summary:ghi789...
```

## 🔧 错误处理

AIContentService 提供了完整的错误处理和降级机制：

```javascript
const result = await ctx.service.aiContentService.generateTitle(content);

if (result.success) {
  // 成功
  console.log('生成的标题:', result.title);
} else {
  // 失败（已降级）
  console.log('降级标题:', result.title); // '未命名文章'
  console.log('错误信息:', result.error);
  console.log('是否降级:', result.fallback); // true
}
```

### 降级策略

当 AI 调用失败时，自动返回降级结果：

| 功能            | 降级结果                  |
| --------------- | ------------------------- |
| generateTitle   | `{ title: '未命名文章' }` |
| extractTags     | `{ tags: [] }`            |
| generateSummary | `{ summary: '' }`         |
| matchCategory   | `{ categories: [] }`      |
| optimizeSEO     | `{ suggestions: {} }`     |
| checkQuality    | `{ assessment: {} }`      |

## 🌍 多语言支持

支持中文和英文：

```javascript
// 中文（默认）
const zhResult = await ctx.service.aiContentService.generateTitle(content, {
  language: 'zh-CN',
});

// 英文
const enResult = await ctx.service.aiContentService.generateTitle(content, {
  language: 'en-US',
});
```

## 📊 使用统计

所有 AI 调用都会自动记录统计信息：

```javascript
// 调用 AI 服务
const result = await ctx.service.aiContentService.generateTitle(content);

// 统计信息已自动记录到数据库
// 可通过 AIModelManager 查看
const stats = await ctx.service.aiModelManager.getOverallStats();
console.log('总调用次数:', stats.totalCalls);
console.log('总成本:', stats.totalCost);
```

## 🎨 实际应用示例

### 示例 1：智能文章发布

```javascript
class ArticleService extends Service {
  async publishWithAI(articleData) {
    const { content, userId } = articleData;

    try {
      // 批量生成内容
      const aiResult = await this.ctx.service.aiContentService.generateBatch(content, {
        title: { style: '专业' },
        tags: { maxTags: 8 },
        summary: { maxLength: 200 },
      });

      // 构建文章数据
      const article = {
        title: aiResult.title.success ? aiResult.title.title : '未命名文章',
        tags: aiResult.tags.success ? aiResult.tags.tags : [],
        summary: aiResult.summary.success ? aiResult.summary.summary : '',
        content,
        userId,
        aiGenerated: {
          title: aiResult.title.success,
          tags: aiResult.tags.success,
          summary: aiResult.summary.success,
        },
      };

      // 保存文章
      return await this.ctx.service.content.create(article);
    } catch (error) {
      this.logger.error('AI publish failed:', error);
      throw error;
    }
  }
}
```

### 示例 2：内容质量检查工作流

```javascript
class ContentReviewService extends Service {
  async reviewArticle(articleId) {
    const article = await this.ctx.service.content.findById(articleId);

    // 1. 质量评估
    const qualityResult = await this.ctx.service.aiContentService.checkQuality(article.title, article.content);

    // 2. SEO 优化
    const seoResult = await this.ctx.service.aiContentService.optimizeSEO(article.title, article.content, {
      keywords: article.tags.join(','),
    });

    // 3. 生成审核报告
    const report = {
      articleId,
      quality: qualityResult.assessment,
      seo: seoResult.suggestions,
      overallScore: qualityResult.assessment?.overallScore || 0,
      recommendations: [
        ...(qualityResult.assessment?.improvements || []),
        seoResult.suggestions?.titleSuggestion,
      ].filter(Boolean),
    };

    // 4. 保存报告
    await this.ctx.service.review.createReport(report);

    return report;
  }
}
```

### 示例 3：批量内容处理

```javascript
class BatchProcessService extends Service {
  async processDraftArticles() {
    const drafts = await this.ctx.service.content.findDrafts();

    const results = [];

    for (const draft of drafts) {
      try {
        // 为每篇草稿生成元数据
        const aiResult = await this.ctx.service.aiContentService.generateBatch(draft.content, {
          strategy: 'cost_optimal', // 批量处理使用成本优先
          useCache: true,
        });

        // 更新草稿
        await this.ctx.service.content.update(draft.id, {
          title: aiResult.title.title,
          tags: aiResult.tags.tags,
          summary: aiResult.summary.summary,
          status: 'ready_for_review',
        });

        results.push({
          id: draft.id,
          success: true,
        });
      } catch (error) {
        this.logger.error(`Failed to process draft ${draft.id}:`, error);
        results.push({
          id: draft.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}
```

### 示例 4：智能分类系统

```javascript
class AutoCategorizationService extends Service {
  async categorizeArticle(articleId) {
    const article = await this.ctx.service.content.findById(articleId);

    // 获取所有分类
    const allCategories = await this.ctx.service.category.findAll();

    // AI 匹配分类
    const result = await this.ctx.service.aiContentService.matchCategory(
      article.content,
      allCategories.map(cat => ({
        name: cat.name,
        description: cat.description,
      }))
    );

    if (result.success && result.categories.length > 0) {
      // 找到匹配的分类 ID
      const categoryIds = allCategories.filter(cat => result.categories.includes(cat.name)).map(cat => cat.id);

      // 更新文章分类
      await this.ctx.service.content.update(articleId, {
        categoryIds,
      });

      return {
        success: true,
        categories: result.categories,
      };
    }

    return {
      success: false,
      message: 'No matching categories found',
    };
  }
}
```

## 🔍 故障排查

### 问题 1：生成结果不理想

**解决方案**：

1. 调整模型选择策略
2. 使用更高质量的模型
3. 优化提示词模板

```javascript
// 使用性能优先策略
const result = await ctx.service.aiContentService.generateTitle(content, {
  strategy: 'performance_optimal',
});
```

### 问题 2：响应时间过长

**解决方案**：

1. 启用缓存
2. 使用更快的模型
3. 缩短输入内容

```javascript
// 启用缓存
const result = await ctx.service.aiContentService.generateTitle(content, {
  useCache: true,
  strategy: 'cost_optimal', // 更快的模型
});
```

### 问题 3：成本过高

**解决方案**：

1. 使用成本优先策略
2. 启用缓存
3. 批量处理

```javascript
// 成本优先
const result = await ctx.service.aiContentService.extractTags(content, {
  strategy: 'cost_optimal',
  useCache: true,
});
```

## 📝 最佳实践

1. **启用缓存**：默认启用缓存以提高性能
2. **选择合适的策略**：根据场景选择模型策略
3. **错误处理**：始终检查 `result.success`
4. **批量处理**：使用 `generateBatch` 提高效率
5. **监控成本**：定期查看使用统计
6. **清理缓存**：定期清理过期缓存
7. **降级处理**：为失败场景提供默认值

## 📚 相关文档

- [提示词管理指南](./PROMPT_MANAGEMENT_GUIDE.md)
- [AI 适配器使用指南](./AI_ADAPTER_USAGE.md)
- [Week 7 完成总结](./WEEK7_COMPLETION_SUMMARY.md)

---

**当前版本**: v0.7.0 (Week 7 完成)  
**下一步**: Week 8 - 发布功能集成
