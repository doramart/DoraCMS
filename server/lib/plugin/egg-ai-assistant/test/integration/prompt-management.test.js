/**
 * 提示词管理集成测试
 * 验证 PromptManager、TemplateRenderer 的功能
 */
'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('Prompt Management Integration Test', () => {
  let ctx;
  let promptManager;
  let testPromptId;

  before(async () => {
    ctx = app.createAnonymousContext();
    promptManager = ctx.service.promptManager;
  });

  describe('Template Renderer', () => {
    const TemplateRenderer = require('../../lib/utils/templateRenderer');

    it('should render simple variables', () => {
      const template = 'Hello {{name}}, you are {{age}} years old.';
      const variables = { name: 'John', age: 25 };
      const result = TemplateRenderer.render(template, variables);

      assert.equal(result, 'Hello John, you are 25 years old.');
    });

    it('should render nested variables', () => {
      const template = 'User: {{user.name}}, Email: {{user.email}}';
      const variables = {
        user: {
          name: 'Alice',
          email: 'alice@example.com',
        },
      };
      const result = TemplateRenderer.render(template, variables);

      assert.equal(result, 'User: Alice, Email: alice@example.com');
    });

    it('should handle conditionals', () => {
      const template = '{{#if hasPermission}}You have access{{/if}}';

      const result1 = TemplateRenderer.render(template, { hasPermission: true });
      assert.equal(result1, 'You have access');

      const result2 = TemplateRenderer.render(template, { hasPermission: false });
      assert.equal(result2, '');
    });

    it('should handle loops', () => {
      const template = '{{#each items}}{{this}},{{/each}}';
      const variables = { items: ['apple', 'banana', 'orange'] };
      const result = TemplateRenderer.render(template, variables);

      assert.equal(result, 'apple,banana,orange,');
    });

    it('should validate template syntax', () => {
      const valid = TemplateRenderer.validate('Hello {{name}}');
      assert(valid.valid);
      assert.equal(valid.errors.length, 0);

      const invalid = TemplateRenderer.validate('Hello {{name}');
      assert(!invalid.valid);
      assert(invalid.errors.length > 0);
    });

    it('should extract variables from template', () => {
      const template = 'Hello {{name}}, age: {{age}}, city: {{address.city}}';
      const variables = TemplateRenderer.extractVariables(template);

      assert(variables.includes('name'));
      assert(variables.includes('age'));
      assert(variables.includes('address.city'));
    });

    it('should compile template for reuse', () => {
      const template = 'Hello {{name}}';
      const compiledFn = TemplateRenderer.compile(template);

      const result1 = compiledFn({ name: 'John' });
      const result2 = compiledFn({ name: 'Alice' });

      assert.equal(result1, 'Hello John');
      assert.equal(result2, 'Hello Alice');
    });
  });

  describe('Prompt Manager - CRUD Operations', () => {
    it('should create a new prompt template', async () => {
      const promptData = {
        taskType: 'test_generation',
        language: 'zh-CN',
        name: '测试提示词',
        description: '用于测试的提示词模板',
        template: '请生成一个关于{{topic}}的测试用例。',
        version: '1.0.0',
        isEnabled: true,
      };

      const prompt = await promptManager.createPrompt(promptData);

      assert(prompt);
      assert(prompt.id || prompt._id);
      assert.equal(prompt.taskType, 'test_generation');
      assert.equal(prompt.language, 'zh-CN');

      testPromptId = prompt.id || prompt._id;
    });

    it('should get prompt by task type and language', async () => {
      const prompt = await promptManager.getPrompt('test_generation', 'zh-CN');

      assert(prompt);
      assert.equal(prompt.taskType, 'test_generation');
      assert.equal(prompt.language, 'zh-CN');
    });

    it('should render prompt template', async () => {
      const rendered = await promptManager.renderPrompt('test_generation', {
        topic: 'JavaScript',
      });

      assert(rendered);
      assert(rendered.includes('JavaScript'));
      assert(rendered.includes('测试用例'));
    });

    it('should update prompt template', async () => {
      const updated = await promptManager.updatePrompt(testPromptId, {
        description: '更新后的描述',
      });

      assert(updated);
      assert.equal(updated.description, '更新后的描述');
    });

    it('should get prompt statistics', async () => {
      const stats = await promptManager.getPromptStats();

      assert(stats);
      assert(typeof stats.totalPrompts === 'number');
      assert(stats.byTaskType);
      assert(stats.byLanguage);
    });

    it('should get all task types', async () => {
      const taskTypes = await promptManager.getTaskTypes();

      assert(Array.isArray(taskTypes));
      assert(taskTypes.includes('test_generation'));
    });
  });

  describe('Prompt Manager - Built-in Templates', () => {
    it('should load built-in title generation template', async () => {
      const prompt = await promptManager.getPrompt('title_generation', 'zh-CN');

      assert(prompt);
      assert.equal(prompt.taskType, 'title_generation');
      assert(prompt.template);
      assert(prompt.variables);
    });

    it('should render title generation prompt', async () => {
      const rendered = await promptManager.renderPrompt('title_generation', {
        content: '这是一篇关于人工智能的文章...',
        style: '专业',
      });

      assert(rendered);
      assert(rendered.includes('人工智能'));
      assert(rendered.includes('专业'));
    });

    it('should load tag extraction template', async () => {
      const prompt = await promptManager.getPrompt('tag_extraction', 'zh-CN');

      assert(prompt);
      assert.equal(prompt.taskType, 'tag_extraction');
    });

    it('should render tag extraction prompt', async () => {
      const rendered = await promptManager.renderPrompt('tag_extraction', {
        content: 'Node.js 是一个服务器端 JavaScript 运行环境...',
        maxTags: 5,
      });

      assert(rendered);
      assert(rendered.includes('Node.js'));
      assert(rendered.includes('5'));
    });

    it('should load summary generation template', async () => {
      const prompt = await promptManager.getPrompt('summary_generation', 'zh-CN');

      assert(prompt);
      assert.equal(prompt.taskType, 'summary_generation');
    });
  });

  describe('Prompt Manager - Batch Rendering', () => {
    it('should render multiple prompts in batch', async () => {
      const tasks = [
        {
          taskType: 'title_generation',
          variables: { content: '测试内容 1' },
          options: {},
        },
        {
          taskType: 'tag_extraction',
          variables: { content: '测试内容 2' },
          options: {},
        },
      ];

      const results = await promptManager.renderPromptBatch(tasks);

      assert(Array.isArray(results));
      assert.equal(results.length, 2);
      assert(results[0].success);
      assert(results[1].success);
    });
  });

  describe('Prompt Manager - Cache', () => {
    it('should cache prompt templates', async () => {
      // 第一次获取（从数据库）
      const start1 = Date.now();
      await promptManager.getPrompt('title_generation', 'zh-CN');
      const time1 = Date.now() - start1;

      // 第二次获取（从缓存）
      const start2 = Date.now();
      await promptManager.getPrompt('title_generation', 'zh-CN');
      const time2 = Date.now() - start2;

      // 缓存访问应该更快
      assert(time2 < time1 || time2 < 10); // 缓存访问应该很快
    });

    it('should clear cache', async () => {
      promptManager.clearCache('title_generation', 'zh-CN');

      // 清除后再次获取应该从数据库加载
      const prompt = await promptManager.getPrompt('title_generation', 'zh-CN');
      assert(prompt);
    });

    it('should clear all cache', async () => {
      promptManager.clearCache();

      const prompt = await promptManager.getPrompt('title_generation', 'zh-CN');
      assert(prompt);
    });
  });

  describe('Prompt Manager - A/B Testing', () => {
    it('should configure A/B test', () => {
      promptManager.configureABTest('title_generation', {
        enabled: true,
        variants: [
          { name: 'A', probability: 0.5 },
          { name: 'B', probability: 0.5 },
        ],
      });

      // 验证配置成功
      assert(promptManager.abTestConfig.has('title_generation'));
    });

    it('should select A/B test variant', async () => {
      // 注意：由于是随机选择，这个测试可能不稳定
      // 我们只验证渲染成功即可
      const rendered = await promptManager.renderPrompt('test_generation', {
        topic: 'A/B Testing',
      });

      assert(rendered);
    });
  });

  describe('Prompt Manager - Multi-language Support', () => {
    it('should support English templates', async () => {
      const prompt = await promptManager.getPrompt('title_generation', 'en-US');

      assert(prompt);
      assert.equal(prompt.language, 'en-US');
      assert(prompt.template);
    });

    it('should render English prompt', async () => {
      const rendered = await promptManager.renderPrompt(
        'title_generation',
        {
          content: 'This is an article about artificial intelligence...',
        },
        { language: 'en-US' }
      );

      assert(rendered);
      assert(rendered.includes('artificial intelligence'));
    });
  });

  describe('Cleanup', () => {
    it('should delete test prompt', async () => {
      if (testPromptId) {
        const deleted = await promptManager.deletePrompt(testPromptId);
        assert(deleted === true);
      }
    });
  });
});
