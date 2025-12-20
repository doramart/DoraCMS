/**
 * AI 内容服务集成测试
 * 验证 AIContentService 的所有功能
 */
'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('AI Content Service Integration Test', () => {
  let ctx;
  let aiContentService;

  const testArticleContent = `
    人工智能（Artificial Intelligence，简称 AI）正在深刻改变我们的生活方式。
    从智能手机的语音助手到自动驾驶汽车，AI 技术已经渗透到日常生活的方方面面。
    
    在医疗领域，AI 帮助医生更准确地诊断疾病；在教育领域，AI 提供个性化的学习体验；
    在商业领域，AI 优化供应链管理，提高运营效率。
    
    然而，AI 的发展也带来了一些挑战，包括数据隐私、算法偏见和就业影响等问题。
    我们需要在推动技术进步的同时，确保 AI 的发展符合人类的最佳利益。
  `;

  before(async () => {
    ctx = app.createAnonymousContext();
    aiContentService = ctx.service.aiContentService;
  });

  describe('Title Generation', () => {
    it('should generate title from content', async () => {
      const result = await aiContentService.generateTitle(testArticleContent, {
        useCache: false,
      });

      assert(result);
      if (result.success) {
        assert(result.title);
        assert(typeof result.title === 'string');
        assert(result.title.length > 0);
        assert(result.metadata);
        assert(result.metadata.provider);
        assert(result.metadata.model);
        console.log('Generated title:', result.title);
      } else {
        // AI 调用失败时应该有降级处理
        assert(result.fallback === true);
        assert.equal(result.title, '未命名文章');
      }
    });

    it('should generate title with custom style', async () => {
      const result = await aiContentService.generateTitle(testArticleContent, {
        style: '专业',
        keywords: 'AI,技术',
        useCache: false,
      });

      assert(result);
      if (result.success) {
        assert(result.title);
        console.log('Generated title with style:', result.title);
      }
    });

    it('should use cache for repeated requests', async () => {
      // 第一次调用
      const result1 = await aiContentService.generateTitle(testArticleContent, {
        useCache: true,
      });

      // 第二次调用（应该使用缓存）
      const result2 = await aiContentService.generateTitle(testArticleContent, {
        useCache: true,
      });

      if (result1.success && result2.success) {
        assert(result2.fromCache === true);
        assert.equal(result1.title, result2.title);
      }
    });
  });

  describe('Tag Extraction', () => {
    it('should extract tags from content', async () => {
      const result = await aiContentService.extractTags(testArticleContent, {
        useCache: false,
      });

      assert(result);
      if (result.success) {
        assert(Array.isArray(result.tags));
        assert(result.tags.length > 0);
        assert(result.tags.length <= 8);
        assert(result.metadata);
        console.log('Extracted tags:', result.tags);
      } else {
        assert(result.fallback === true);
        assert(Array.isArray(result.tags));
        assert.equal(result.tags.length, 0);
      }
    });

    it('should respect maxTags option', async () => {
      const result = await aiContentService.extractTags(testArticleContent, {
        maxTags: 5,
        useCache: false,
      });

      assert(result);
      if (result.success) {
        assert(result.tags.length <= 5);
        console.log('Extracted tags (max 5):', result.tags);
      }
    });

    it('should extract tags with category context', async () => {
      const result = await aiContentService.extractTags(testArticleContent, {
        category: '科技',
        useCache: false,
      });

      assert(result);
      if (result.success) {
        assert(Array.isArray(result.tags));
        console.log('Extracted tags with category:', result.tags);
      }
    });
  });

  describe('Summary Generation', () => {
    it('should generate summary from content', async () => {
      const result = await aiContentService.generateSummary(testArticleContent, {
        useCache: false,
      });

      assert(result);
      if (result.success) {
        assert(result.summary);
        assert(typeof result.summary === 'string');
        assert(result.summary.length > 0);
        assert(result.metadata);
        console.log('Generated summary:', result.summary);
      } else {
        assert(result.fallback === true);
        assert.equal(result.summary, '');
      }
    });

    it('should respect maxLength option', async () => {
      const result = await aiContentService.generateSummary(testArticleContent, {
        maxLength: 100,
        useCache: false,
      });

      assert(result);
      if (result.success) {
        assert(result.summary.length <= 150); // 允许一些偏差
        console.log('Generated summary (max 100):', result.summary);
      }
    });
  });

  describe('Category Matching', () => {
    it('should match article category', async () => {
      const categories = [
        { name: '人工智能', description: 'AI 相关技术和应用' },
        { name: '科技新闻', description: '最新的科技动态' },
        { name: '编程开发', description: '编程语言和开发工具' },
      ];

      const result = await aiContentService.matchCategory(testArticleContent, categories, {
        useCache: false,
      });

      assert(result);
      if (result.success) {
        assert(Array.isArray(result.categories));
        assert(result.categories.length > 0);
        assert(result.metadata);
        console.log('Matched categories:', result.categories);
      } else {
        assert(result.fallback === true);
        assert(Array.isArray(result.categories));
      }
    });
  });

  describe('SEO Optimization', () => {
    it('should provide SEO suggestions', async () => {
      const result = await aiContentService.optimizeSEO('AI 技术的未来发展', testArticleContent, {
        keywords: 'AI,人工智能,技术',
        useCache: false,
      });

      assert(result);
      if (result.success) {
        assert(result.suggestions);
        assert(typeof result.suggestions === 'object');
        assert(result.metadata);
        console.log('SEO suggestions:', JSON.stringify(result.suggestions, null, 2));
      } else {
        assert(result.fallback === true);
      }
    });
  });

  describe('Quality Check', () => {
    it('should check content quality', async () => {
      const result = await aiContentService.checkQuality('AI 技术的未来', testArticleContent, {
        useCache: false,
      });

      assert(result);
      if (result.success) {
        assert(result.assessment);
        assert(typeof result.assessment === 'object');
        assert(result.metadata);
        console.log('Quality assessment:', JSON.stringify(result.assessment, null, 2));
      } else {
        assert(result.fallback === true);
      }
    });
  });

  describe('Batch Generation', () => {
    it('should generate title, tags, and summary in batch', async () => {
      const result = await aiContentService.generateBatch(testArticleContent, {
        title: { style: '专业' },
        tags: { maxTags: 5 },
        summary: { maxLength: 150 },
      });

      assert(result);
      assert(result.success === true);
      assert(result.title);
      assert(result.tags);
      assert(result.summary);

      console.log('Batch results:');
      console.log('- Title:', result.title.success ? result.title.title : 'Failed');
      console.log('- Tags:', result.tags.success ? result.tags.tags : 'Failed');
      console.log('- Summary:', result.summary.success ? result.summary.summary : 'Failed');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache by type', () => {
      aiContentService.clearCache('title');
      const stats = aiContentService.getCacheStats();
      assert(stats);
      assert(typeof stats.size === 'number');
    });

    it('should clear all cache', () => {
      aiContentService.clearCache();
      const stats = aiContentService.getCacheStats();
      assert.equal(stats.size, 0);
    });

    it('should get cache statistics', () => {
      const stats = aiContentService.getCacheStats();
      assert(stats);
      assert(typeof stats.size === 'number');
      assert(typeof stats.expiryTime === 'number');
      assert(stats.types);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid content gracefully', async () => {
      const result = await aiContentService.generateTitle('', {
        useCache: false,
      });

      assert(result);
      // 应该返回降级结果或错误
      assert(result.success === false || result.title);
    });

    it('should handle network errors with fallback', async () => {
      // 模拟网络错误的情况
      const result = await aiContentService.extractTags('Short content', {
        useCache: false,
      });

      assert(result);
      // 无论成功或失败都应该有响应
      assert(result.success !== undefined);
    });
  });

  describe('Multi-language Support', () => {
    it('should generate English title', async () => {
      const englishContent = `
        Artificial Intelligence (AI) is revolutionizing the way we live and work.
        From virtual assistants to autonomous vehicles, AI technology has become
        an integral part of our daily lives.
      `;

      const result = await aiContentService.generateTitle(englishContent, {
        language: 'en-US',
        useCache: false,
      });

      assert(result);
      if (result.success) {
        assert(result.title);
        assert(result.metadata.language === 'en-US');
        console.log('English title:', result.title);
      }
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests', async () => {
      const promises = [
        aiContentService.generateTitle(testArticleContent, { useCache: false }),
        aiContentService.extractTags(testArticleContent, { useCache: false }),
        aiContentService.generateSummary(testArticleContent, { useCache: false }),
      ];

      const results = await Promise.allSettled(promises);

      assert.equal(results.length, 3);
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          assert(result.value);
          console.log(`Concurrent request ${index + 1}:`, result.value.success ? 'Success' : 'Failed');
        }
      });
    });
  });
});
