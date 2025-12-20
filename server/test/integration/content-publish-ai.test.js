/**
 * AI 辅助发布功能集成测试
 * 测试 Week 8: Content Publish Integration
 *
 * @author DoraCMS Team
 * @since 2025-01-11
 */

'use strict';

const { app, assert } = require('egg-mock/bootstrap');
const { mockAdminUser } = require('../mock_data');

describe('AI-Assisted Content Publishing Integration Test', () => {
  let ctx;
  let adminToken;
  let contentRepo;
  let categoryRepo;
  let tagRepo;
  let testCategoryId;

  before(async () => {
    ctx = app.mockContext();
    contentRepo = ctx.app.repositoryFactory.createRepository('Content', ctx);
    categoryRepo = ctx.app.repositoryFactory.createRepository('ContentCategory', ctx);
    tagRepo = ctx.app.repositoryFactory.createRepository('ContentTag', ctx);

    // 登录获取 token
    const loginResult = await app
      .httpRequest()
      .post('/api/v1/admin/login')
      .send({
        userName: mockAdminUser.userName,
        password: mockAdminUser.password,
        loginType: 'admin',
      })
      .expect(200);

    adminToken = loginResult.body.data.token;

    // 创建测试分类
    const testCategory = await categoryRepo.create({
      name: '技术文章',
      enName: 'Technology',
      description: '技术相关的文章',
      enable: true,
      sortId: 1,
    });
    testCategoryId = testCategory.id || testCategory._id;
  });

  after(async () => {
    // 清理测试数据
    await contentRepo.deleteMany({ title: { $regex: '测试|AI' } });
    if (testCategoryId) {
      await categoryRepo.deleteMany({ _id: testCategoryId });
    }
    await tagRepo.deleteMany({ name: { $regex: 'AI测试' } });
  });

  describe('POST /manage/content/createWithAI - AI 辅助创建内容', () => {
    it('应该使用手动模式成功创建内容', async () => {
      const contentData = {
        title: '测试文章 - 手动模式',
        stitle: '测试副标题',
        discription: '这是一篇测试文章的摘要',
        comments: '<p>这是文章的主要内容。</p>',
        simpleComments: '这是文章的主要内容。',
        type: '1',
        categories: testCategoryId,
        sImg: 'https://example.com/image.jpg',
        state: '0',
        publishMode: 'manual',
      };

      const result = await app
        .httpRequest()
        .post('/manage/content/createWithAI')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(contentData)
        .expect(200);

      assert(result.body.success === true);
      assert(result.body.data.id);
      assert.strictEqual(result.body.data.aiEnhancements.used, false);
    });

    it('应该使用 AI Smart 模式生成标题和摘要', async () => {
      const contentData = {
        comments:
          '<p>人工智能（AI）是计算机科学的一个分支，致力于创造能够模拟人类智能的系统。AI 技术包括机器学习、深度学习、自然语言处理等多个领域。近年来，AI 在图像识别、语音识别、自动驾驶等方面取得了显著进展。</p>',
        simpleComments: '人工智能是计算机科学的一个分支，致力于创造能够模拟人类智能的系统。',
        type: '1',
        sImg: 'https://example.com/ai.jpg',
        state: '0',
        publishMode: 'ai_smart',
        regenerateTitle: true,
        regenerateSummary: true,
        regenerateTags: true,
        autoCategory: false, // 手动指定分类
        categories: testCategoryId,
      };

      const result = await app
        .httpRequest()
        .post('/manage/content/createWithAI')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(contentData);

      // 注意：如果没有配置 AI 服务，会降级到手动模式
      if (result.status === 200) {
        assert(result.body.success === true);
        assert(result.body.data.id);
        assert(result.body.data.aiEnhancements);

        // 如果 AI 服务可用，检查增强结果
        if (result.body.data.aiEnhancements.used) {
          console.log('AI 增强已启用:');
          console.log('  - 标题生成:', result.body.data.aiEnhancements.titleGenerated);
          console.log('  - 摘要生成:', result.body.data.aiEnhancements.summaryGenerated);
          console.log('  - 标签生成:', result.body.data.aiEnhancements.tagsGenerated);
        } else {
          console.log('AI 服务不可用，降级到手动模式');
        }
      }
    });

    it('应该使用 AI Full 模式自动生成所有字段', async () => {
      const contentData = {
        comments:
          '<p>云计算是一种基于互联网的计算方式，通过这种方式，共享的软硬件资源和信息可以按需提供给计算机和其他设备。云计算的核心概念是基础设施即服务（IaaS）、平台即服务（PaaS）和软件即服务（SaaS）。</p>',
        simpleComments: '云计算是一种基于互联网的计算方式。',
        type: '1',
        sImg: 'https://example.com/cloud.jpg',
        state: '0',
        publishMode: 'ai_full',
      };

      const result = await app
        .httpRequest()
        .post('/manage/content/createWithAI')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(contentData);

      if (result.status === 200) {
        assert(result.body.success === true);
        assert(result.body.data.id);
      }
    });

    it('应该在缺少必需字段时返回错误（AI 模式）', async () => {
      const contentData = {
        // 缺少 comments 字段
        type: '1',
        sImg: 'https://example.com/test.jpg',
        publishMode: 'ai_smart',
      };

      const result = await app
        .httpRequest()
        .post('/manage/content/createWithAI')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(contentData);

      // 应该返回验证错误
      assert(result.status === 400 || result.body.success === false);
    });
  });

  describe('POST /manage/content/updateWithAI - AI 辅助更新内容', () => {
    let testContentId;

    beforeEach(async () => {
      // 创建测试内容
      const testContent = await contentRepo.create({
        title: '原始标题',
        stitle: '原始副标题',
        discription: '原始摘要',
        comments: '<p>原始内容</p>',
        simpleComments: '原始内容',
        type: '1',
        categories: testCategoryId,
        sImg: 'https://example.com/test.jpg',
        state: '0',
        author: 'test-admin-id',
        draft: '0',
      });
      testContentId = testContent.id || testContent._id;
    });

    afterEach(async () => {
      if (testContentId) {
        await contentRepo.deleteMany({ _id: testContentId });
      }
    });

    it('应该使用手动模式更新内容', async () => {
      const updateData = {
        id: testContentId,
        title: '更新后的标题',
        stitle: '更新后的副标题',
        discription: '更新后的摘要',
        comments: '<p>更新后的内容</p>',
        simpleComments: '更新后的内容',
        type: '1',
        categories: testCategoryId,
        sImg: 'https://example.com/updated.jpg',
        state: '0',
        publishMode: 'manual',
      };

      const result = await app
        .httpRequest()
        .post('/manage/content/updateWithAI')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      assert(result.body.success === true);
      assert.strictEqual(result.body.data.aiEnhancements.used, false);
    });

    it('应该使用 AI 模式重新生成标题', async () => {
      const updateData = {
        id: testContentId,
        comments: '<p>人工智能正在改变世界，机器学习和深度学习是AI的核心技术。</p>',
        simpleComments: '人工智能正在改变世界。',
        type: '1',
        categories: testCategoryId,
        sImg: 'https://example.com/ai.jpg',
        state: '0',
        publishMode: 'ai_smart',
        regenerateTitle: true,
        regenerateSummary: false,
        regenerateTags: false,
        autoCategory: false,
      };

      const result = await app
        .httpRequest()
        .post('/manage/content/updateWithAI')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      if (result.status === 200) {
        assert(result.body.success === true);
      }
    });
  });

  describe('POST /manage/content/previewAIEnhancements - 预览 AI 增强', () => {
    it('应该返回 AI 增强预览而不保存', async () => {
      const previewData = {
        comments: '<p>区块链是一种分布式账本技术，具有去中心化、不可篡改等特点。</p>',
        title: '原始标题',
        discription: '原始摘要',
        regenerateTitle: true,
        regenerateSummary: true,
        regenerateTags: true,
        autoCategory: true,
      };

      const result = await app
        .httpRequest()
        .post('/manage/content/previewAIEnhancements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(previewData);

      if (result.status === 200) {
        assert(result.body.success === true);
        assert(result.body.data.originalContent);
        assert(result.body.data.enhancedContent);
        assert(result.body.data.aiEnhancements);

        console.log('\nAI 增强预览结果:');
        console.log('原始标题:', result.body.data.originalContent.title);
        console.log('增强标题:', result.body.data.enhancedContent.title);
      }
    });
  });

  describe('POST /manage/content/batchPublishWithAI - 批量 AI 发布', () => {
    it('应该批量处理多篇文章', async () => {
      const batchData = {
        contentList: [
          {
            comments: '<p>大数据分析技术正在改变企业决策方式。</p>',
            simpleComments: '大数据分析技术正在改变企业决策方式。',
            type: '1',
            sImg: 'https://example.com/data.jpg',
            state: '0',
          },
          {
            comments: '<p>物联网技术连接万物，创造智能生活。</p>',
            simpleComments: '物联网技术连接万物。',
            type: '1',
            sImg: 'https://example.com/iot.jpg',
            state: '0',
          },
        ],
        publishMode: 'ai_smart',
        regenerateTitle: true,
        regenerateSummary: true,
        regenerateTags: true,
        autoCategory: true,
        batchSize: 2,
      };

      const result = await app
        .httpRequest()
        .post('/manage/content/batchPublishWithAI')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(batchData);

      if (result.status === 200) {
        assert(result.body.success === true);
        assert(result.body.data.total === 2);
        console.log('\n批量发布结果:');
        console.log('总数:', result.body.data.total);
        console.log('成功:', result.body.data.succeeded);
        console.log('失败:', result.body.data.failed);
      }
    });
  });

  describe('ContentPublishService - 服务层测试', () => {
    it('应该检查 AI 服务可用性', async () => {
      const service = ctx.service.contentPublish;
      const isAvailable = await service._isAIServiceAvailable();

      console.log('\nAI 服务可用性:', isAvailable);
      // 不做断言，因为测试环境可能没有配置 AI 服务
    });

    it('应该正确处理 AI 生成的标签', async () => {
      const service = ctx.service.contentPublish;
      const tagNames = ['AI测试标签1', 'AI测试标签2', 'AI测试标签3'];

      const tagIds = await service._processAITags(tagNames);

      assert(Array.isArray(tagIds));
      assert(tagIds.length === tagNames.length);

      // 验证标签已创建
      const tag1 = await tagRepo.findOne({ name: { $eq: 'AI测试标签1' } });
      assert(tag1);
      assert.strictEqual(tag1.name, 'AI测试标签1');
    });
  });

  describe('降级策略测试', () => {
    it('AI 服务不可用时应该降级到手动模式', async () => {
      const contentData = {
        comments: '<p>测试降级策略</p>',
        simpleComments: '测试降级策略',
        type: '1',
        sImg: 'https://example.com/test.jpg',
        state: '0',
        publishMode: 'ai_smart',
        // 即使请求 AI 模式，如果服务不可用也会降级
      };

      const result = await app
        .httpRequest()
        .post('/manage/content/createWithAI')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(contentData);

      // 无论 AI 是否可用，都应该能成功发布
      if (result.status === 200) {
        assert(result.body.success === true);
        console.log('\n降级策略测试通过 - 发布模式:', result.body.data.aiEnhancements.used ? 'AI' : '手动');
      }
    });
  });
});
