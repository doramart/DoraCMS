# 提示词管理系统使用指南

## 📋 概述

提示词管理系统提供了完整的提示词模板管理功能，包括模板创建、渲染、版本管理、多语言支持和 A/B 测试。

## 🏗️ 架构

```
PromptManager Service (提示词管理)
    ↓
TemplateRenderer (模板渲染引擎)
    ↓
Repository Layer (数据持久化)
```

## 🚀 快速开始

### 1. 渲染内置提示词

```javascript
// 在 Service 中使用
class YourService extends Service {
  async generateTitleWithAI(content) {
    // 渲染标题生成提示词
    const prompt = await this.service.promptManager.renderPrompt(
      'title_generation',
      {
        content,
        style: '专业',
        keywords: 'AI,技术',
      },
      {
        language: 'zh-CN', // 可选，默认 zh-CN
      }
    );

    // 使用 AI 生成标题
    const { model, adapter } = await this.service.modelSelector.selectOptimalModel({
      taskType: 'title_generation',
    });

    const result = await adapter.generateWithRetry(prompt, {
      model: model.modelName,
      maxTokens: 100,
    });

    return result.content;
  }
}
```

### 2. 创建自定义提示词模板

```javascript
async createCustomPrompt() {
  const promptData = {
    taskType: 'my_custom_task',
    language: 'zh-CN',
    name: '自定义任务',
    description: '这是一个自定义的提示词模板',
    template: `你是一个专业的{{role}}助手。

请处理以下任务：
{{task}}

{{#if requirements}}
要求：
{{#each requirements}}
- {{this}}
{{/each}}
{{/if}}

请输出结果。`,
    version: '1.0.0',
    variables: [
      {
        name: 'role',
        type: 'string',
        required: true,
        description: '角色定义',
      },
      {
        name: 'task',
        type: 'string',
        required: true,
        description: '任务描述',
      },
      {
        name: 'requirements',
        type: 'array',
        required: false,
        description: '任务要求列表',
      },
    ],
  };

  const prompt = await this.service.promptManager.createPrompt(promptData);
  console.log('Prompt created:', prompt.id);
}
```

## 📝 模板语法

### 1. 变量替换

```javascript
// 简单变量
'Hello {{name}}';
// 变量：{ name: 'John' }
// 结果：'Hello John'

// 嵌套对象
'User: {{user.name}}, Email: {{user.email}}';
// 变量：{ user: { name: 'Alice', email: 'alice@example.com' } }
// 结果：'User: Alice, Email: alice@example.com'
```

### 2. 条件语句

```javascript
// 基本条件
'{{#if hasPermission}}You have access{{/if}}' // 变量：{ hasPermission: true }
// 结果：'You have access'

// 复杂条件
`{{#if user.isVIP}}
VIP 用户：{{user.name}}
特殊优惠：{{offer}}
{{/if}}`;
```

### 3. 循环语句

```javascript
// 简单循环
`标签：
{{#each tags}}
- {{this}}
{{/each}}` // 变量：{ tags: ['JavaScript', 'Node.js', 'React'] }
// 结果：
// 标签：
// - JavaScript
// - Node.js
// - React

// 带索引的循环
`{{#each items}}
{{@index}}. {{this}} {{#if @first}}(首个){{/if}} {{#if @last}}(最后){{/if}}
{{/each}}`;
// 特殊变量：@index, @first, @last
```

## 🎯 内置提示词模板

### 1. 标题生成 (title_generation)

```javascript
const rendered = await ctx.service.promptManager.renderPrompt('title_generation', {
  content: '文章内容...',
  style: '专业', // 可选
  keywords: 'AI,技术', // 可选
});
```

**变量说明**：

- `content` (必需): 文章内容
- `style` (可选): 标题风格（正式、轻松、专业等）
- `keywords` (可选): 必须包含的关键词

### 2. 标签提取 (tag_extraction)

```javascript
const rendered = await ctx.service.promptManager.renderPrompt('tag_extraction', {
  content: '文章内容...',
  maxTags: 5, // 可选
  category: '技术', // 可选
});
```

**变量说明**：

- `content` (必需): 文章内容
- `maxTags` (可选): 最多提取的标签数量
- `category` (可选): 文章类别

### 3. 摘要生成 (summary_generation)

```javascript
const rendered = await ctx.service.promptManager.renderPrompt('summary_generation', {
  content: '文章内容...',
  maxLength: 200, // 可选
  style: '客观', // 可选
});
```

### 4. 分类匹配 (category_matching)

```javascript
const rendered = await ctx.service.promptManager.renderPrompt('category_matching', {
  content: '文章内容...',
  categories: [
    { name: '前端开发', description: 'HTML, CSS, JavaScript 等' },
    { name: '后端开发', description: '服务器端开发' },
  ],
});
```

### 5. SEO 优化 (seo_optimization)

```javascript
const rendered = await ctx.service.promptManager.renderPrompt('seo_optimization', {
  title: '文章标题',
  content: '文章内容...',
  keywords: '目标关键词', // 可选
});
```

### 6. 内容质量评估 (content_quality_check)

```javascript
const rendered = await ctx.service.promptManager.renderPrompt('content_quality_check', {
  title: '文章标题',
  content: '文章内容...',
});
```

## 🌍 多语言支持

### 支持的语言

- `zh-CN`: 简体中文
- `en-US`: 英语

### 使用不同语言

```javascript
// 使用英语模板
const englishPrompt = await ctx.service.promptManager.renderPrompt(
  'title_generation',
  { content: 'Article content...' },
  { language: 'en-US' }
);

// 使用中文模板（默认）
const chinesePrompt = await ctx.service.promptManager.renderPrompt(
  'title_generation',
  { content: '文章内容...' },
  { language: 'zh-CN' }
);
```

## 🔄 版本管理

### 创建新版本

```javascript
// 创建 v2.0.0 版本
await ctx.service.promptManager.createPrompt({
  taskType: 'title_generation',
  language: 'zh-CN',
  version: '2.0.0',
  template: '新版本的模板...',
  // ...其他字段
});
```

### 使用特定版本

```javascript
// 使用最新版本（默认）
const latest = await ctx.service.promptManager.getPrompt('title_generation', 'zh-CN');

// 使用特定版本
const v1 = await ctx.service.promptManager.getPrompt('title_generation', 'zh-CN', { version: '1.0.0' });
```

## 🧪 A/B 测试

### 配置 A/B 测试

```javascript
// 配置 A/B 测试
ctx.service.promptManager.configureABTest('title_generation', {
  enabled: true,
  variants: [
    { name: 'A', probability: 0.5 },
    { name: 'B', probability: 0.5 },
  ],
});
```

### 在提示词模板中定义变体

```javascript
await ctx.service.promptManager.createPrompt({
  taskType: 'title_generation',
  language: 'zh-CN',
  template: '主模板...', // 默认模板
  variants: [
    {
      name: 'variant_A',
      template: '变体 A 的模板...',
      probability: 0.5,
    },
    {
      name: 'variant_B',
      template: '变体 B 的模板...',
      probability: 0.5,
    },
  ],
  // ...其他字段
});
```

## 📊 统计和监控

### 查看提示词统计

```javascript
// 全部统计
const stats = await ctx.service.promptManager.getPromptStats();
console.log(stats);
// {
//   totalPrompts: 10,
//   byTaskType: {
//     title_generation: { count: 2, usage: 150, languages: ['zh-CN', 'en-US'] },
//     tag_extraction: { count: 1, usage: 80, languages: ['zh-CN'] }
//   },
//   byLanguage: {
//     'zh-CN': { count: 8, usage: 200 },
//     'en-US': { count: 2, usage: 30 }
//   },
//   totalUsage: 230
// }

// 特定任务类型的统计
const taskStats = await ctx.service.promptManager.getPromptStats('title_generation');
```

### 查看所有任务类型

```javascript
const taskTypes = await ctx.service.promptManager.getTaskTypes();
console.log(taskTypes);
// ['title_generation', 'tag_extraction', 'summary_generation', ...]
```

## 🔧 高级功能

### 1. 批量渲染

```javascript
const tasks = [
  {
    taskType: 'title_generation',
    variables: { content: '内容 1' },
    options: { language: 'zh-CN' },
  },
  {
    taskType: 'tag_extraction',
    variables: { content: '内容 2' },
    options: { language: 'zh-CN' },
  },
];

const results = await ctx.service.promptManager.renderPromptBatch(tasks);
// [
//   { success: true, taskType: 'title_generation', rendered: '...' },
//   { success: true, taskType: 'tag_extraction', rendered: '...' }
// ]
```

### 2. 模板验证

```javascript
const TemplateRenderer = require('../lib/utils/templateRenderer');

const validation = TemplateRenderer.validate('Hello {{name}}');
if (!validation.valid) {
  console.error('Template errors:', validation.errors);
}
```

### 3. 提取模板变量

```javascript
const TemplateRenderer = require('../lib/utils/templateRenderer');

const template = 'Hello {{name}}, age: {{age}}';
const variables = TemplateRenderer.extractVariables(template);
console.log(variables); // ['name', 'age']
```

### 4. 预编译模板

```javascript
const TemplateRenderer = require('../lib/utils/templateRenderer');

// 编译一次，多次使用
const renderFn = TemplateRenderer.compile('Hello {{name}}');

const result1 = renderFn({ name: 'John' });
const result2 = renderFn({ name: 'Alice' });
```

## 💾 缓存管理

### 清除缓存

```javascript
// 清除特定提示词缓存
ctx.service.promptManager.clearCache('title_generation', 'zh-CN');

// 清除特定任务类型的所有缓存
ctx.service.promptManager.clearCache('title_generation');

// 清除所有缓存
ctx.service.promptManager.clearCache();
```

## 🎨 实际应用示例

### 示例 1：智能文章发布

```javascript
class ArticlePublishService extends Service {
  async publishWithAI(articleContent, options = {}) {
    const results = {};

    try {
      // 1. 生成标题
      const titlePrompt = await this.service.promptManager.renderPrompt('title_generation', {
        content: articleContent,
        style: options.titleStyle || '专业',
      });

      const titleResult = await this._callAI(titlePrompt, { maxTokens: 100 });
      results.title = titleResult.content;

      // 2. 提取标签
      const tagsPrompt = await this.service.promptManager.renderPrompt('tag_extraction', {
        content: articleContent,
        maxTags: 8,
      });

      const tagsResult = await this._callAI(tagsPrompt, { maxTokens: 50 });
      results.tags = tagsResult.content.split(',').map(tag => tag.trim());

      // 3. 生成摘要
      const summaryPrompt = await this.service.promptManager.renderPrompt('summary_generation', {
        content: articleContent,
        maxLength: 200,
      });

      const summaryResult = await this._callAI(summaryPrompt, { maxTokens: 200 });
      results.summary = summaryResult.content;

      // 4. 保存文章
      const article = await this.ctx.service.content.create({
        ...results,
        content: articleContent,
        userId: options.userId,
      });

      return { success: true, article };
    } catch (error) {
      this.logger.error('[ArticlePublish] AI publish failed:', error);
      return { success: false, error: error.message };
    }
  }

  async _callAI(prompt, options) {
    const { model, adapter } = await this.service.modelSelector.selectOptimalModel({
      taskType: 'content_generation',
      strategy: 'balanced',
    });

    return await adapter.generateWithRetry(prompt, {
      model: model.modelName,
      ...options,
    });
  }
}
```

### 示例 2：内容质量检查

```javascript
async checkContentQuality(article) {
  const prompt = await this.service.promptManager.renderPrompt('content_quality_check', {
    title: article.title,
    content: article.content,
  });

  const { model, adapter } = await this.service.modelSelector.selectOptimalModel({
    taskType: 'content_analysis',
  });

  const result = await adapter.generateWithRetry(prompt, {
    model: model.modelName,
    maxTokens: 500,
  });

  // 解析 JSON 结果
  const quality = JSON.parse(result.content);

  return {
    overallScore: quality.overallScore,
    dimensions: {
      originality: quality.originality,
      structure: quality.structure,
      language: quality.language,
      depth: quality.depth,
      readability: quality.readability,
      practicality: quality.practicality,
    },
    improvements: quality.improvements,
  };
}
```

## 🔍 故障排查

### 问题 1：提示词未找到

```javascript
// 错误：Prompt template not found

// 解决方案 1：检查任务类型和语言
const taskTypes = await ctx.service.promptManager.getTaskTypes();
console.log('Available task types:', taskTypes);

// 解决方案 2：创建缺失的提示词
await ctx.service.promptManager.createPrompt({
  taskType: 'your_task_type',
  language: 'zh-CN',
  template: '...',
  // ...
});
```

### 问题 2：模板渲染错误

```javascript
// 错误：Invalid template syntax

// 解决方案：验证模板语法
const TemplateRenderer = require('../lib/utils/templateRenderer');
const validation = TemplateRenderer.validate(yourTemplate);
if (!validation.valid) {
  console.error('Errors:', validation.errors);
}
```

### 问题 3：变量未定义

```javascript
// 错误：Variable "xxx" is not defined

// 解决方案：使用非严格模式（默认）
const rendered = TemplateRenderer.render(template, variables, { strict: false });

// 或者提供所有必需变量
const variables = TemplateRenderer.extractVariables(template);
console.log('Required variables:', variables);
```

## 📚 相关文档

- [AI 适配器层文档](./AI_ADAPTER_USAGE.md)
- [Repository 层文档](../app/repository/README.md)
- [Week 5-6 完成总结](./WEEK5-6_COMPLETION_SUMMARY.md)

## 🎯 最佳实践

1. **使用内置模板**：优先使用内置的提示词模板
2. **变量验证**：创建提示词前验证模板语法
3. **缓存管理**：合理使用缓存提高性能
4. **版本控制**：重要更新创建新版本
5. **A/B 测试**：用数据驱动提示词优化
6. **多语言支持**：为国际化应用准备多语言模板
7. **统计监控**：定期查看提示词使用统计

---

**当前版本**: v0.5.0 (Week 5-6 完成)  
**下一步**: Week 7 - AI Content Service 统一服务层
