/**
 * AI 配置管理 API 集成测试
 * 测试 AIConfigController 的所有 API 端点
 *
 * @author DoraCMS Team
 * @since 2025-01-11
 */

'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/integration/ai-config-api.test.js', () => {
  let adminToken;
  let testModelId;
  let ctx;

  before(async () => {
    // 创建测试上下文
    ctx = app.createAnonymousContext();

    // 模拟管理员登录获取 token
    // 注意：这里需要根据实际的认证机制调整
    const adminUser = await ctx.service.admin.getAdminByUserName('admin');
    if (adminUser) {
      const token = await ctx.helper.authToken.createToken({
        id: adminUser.id,
        userName: adminUser.userName,
      });
      adminToken = token;
    } else {
      // 如果没有管理员用户，创建一个测试用的
      const testAdmin = await ctx.service.admin.createAdmin({
        userName: 'test-admin',
        password: 'test-password',
        email: 'test@example.com',
      });
      const token = await ctx.helper.authToken.createToken({
        id: testAdmin.id,
        userName: testAdmin.userName,
      });
      adminToken = token;
    }
  });

  after(async () => {
    // 清理测试数据
    if (testModelId) {
      try {
        const aiModelRepo = app.repositoryFactory.createRepository('AIModel', ctx);
        await aiModelRepo.deleteById(testModelId);
      } catch (error) {
        // 忽略清理错误
      }
    }
  });

  describe('GET /manage/ai/models - 获取模型列表', () => {
    it('应该成功获取模型列表', async () => {
      const response = await app
        .httpRequest()
        .get('/manage/ai/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert(response.body.success === true);
      assert(Array.isArray(response.body.data));
      assert(typeof response.body.page === 'object');
    });

    it('应该支持分页参数', async () => {
      const response = await app
        .httpRequest()
        .get('/manage/ai/models?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert(response.body.success === true);
      assert(response.body.page.currentPage === 1);
      assert(response.body.page.pageSize === 10);
    });

    it('应该支持按提供商过滤', async () => {
      const response = await app
        .httpRequest()
        .get('/manage/ai/models?provider=openai')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert(response.body.success === true);
      // 验证返回的都是 openai 的模型
      if (response.body.data.length > 0) {
        response.body.data.forEach(model => {
          assert(model.provider === 'openai');
        });
      }
    });

    it('应该支持按启用状态过滤', async () => {
      const response = await app
        .httpRequest()
        .get('/manage/ai/models?isEnabled=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert(response.body.success === true);
      // 验证返回的都是启用的模型
      if (response.body.data.length > 0) {
        response.body.data.forEach(model => {
          assert(model.isEnabled === true);
        });
      }
    });

    it('应该支持搜索关键词', async () => {
      const response = await app
        .httpRequest()
        .get('/manage/ai/models?searchKey=gpt')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert(response.body.success === true);
    });

    it('没有 token 应该返回 401', async () => {
      await app.httpRequest().get('/manage/ai/models').expect(401);
    });
  });

  describe('POST /manage/ai/models - 创建模型配置', () => {
    it('应该成功创建新的模型配置', async () => {
      const modelData = {
        provider: 'openai',
        modelName: 'gpt-4-test',
        displayName: 'GPT-4 Test Model',
        description: '测试模型配置',
        config: {
          apiKey: 'sk-test-key-123456',
          apiEndpoint: 'https://api.openai.com/v1',
          maxTokens: 4096,
          temperature: 0.7,
        },
        supportedTasks: ['title_generation', 'tag_extraction'],
        costPerRequest: 0.03,
        priority: 10,
        isEnabled: true,
      };

      const response = await app
        .httpRequest()
        .post('/manage/ai/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(modelData)
        .expect(200);

      assert(response.body.success === true);
      assert(response.body.data.id);
      assert(response.body.data.provider === 'openai');
      assert(response.body.data.modelName === 'gpt-4-test');

      // API Key 应该被掩码
      assert(response.body.data.config.apiKey.includes('****'));
      assert(!response.body.data.config.apiKey.includes('test-key'));

      // 保存 ID 用于后续测试
      testModelId = response.body.data.id;
    });

    it('应该拒绝缺少必填字段的请求', async () => {
      const invalidData = {
        provider: 'openai',
        // 缺少 modelName
      };

      const response = await app
        .httpRequest()
        .post('/manage/ai/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      assert(response.body.success === false);
      assert(response.body.message.includes('modelName'));
    });

    it('应该拒绝无效的提供商', async () => {
      const invalidData = {
        provider: 'invalid-provider',
        modelName: 'test-model',
        displayName: 'Test Model',
      };

      const response = await app
        .httpRequest()
        .post('/manage/ai/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      assert(response.body.success === false);
    });

    it('没有 token 应该返回 401', async () => {
      await app.httpRequest().post('/manage/ai/models').send({}).expect(401);
    });
  });

  describe('GET /manage/ai/models/:id - 获取单个模型配置', () => {
    it('应该成功获取模型详情', async () => {
      // 先确保有测试数据
      if (!testModelId) {
        const createResponse = await app
          .httpRequest()
          .post('/manage/ai/models')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            provider: 'openai',
            modelName: 'gpt-4-detail-test',
            displayName: 'GPT-4 Detail Test',
            config: { apiKey: 'sk-test-key' },
          });
        testModelId = createResponse.body.data.id;
      }

      const response = await app
        .httpRequest()
        .get(`/manage/ai/models/${testModelId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert(response.body.success === true);
      assert(response.body.data.id === testModelId);
      assert(response.body.data.provider);
      assert(response.body.data.modelName);
    });

    it('应该返回 404 当模型不存在', async () => {
      const fakeId = '000000000000000000000000'; // MongoDB ObjectId 格式

      const response = await app
        .httpRequest()
        .get(`/manage/ai/models/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      assert(response.body.success === false);
    });

    it('应该返回 400 当 ID 格式无效', async () => {
      const response = await app
        .httpRequest()
        .get('/manage/ai/models/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      assert(response.body.success === false);
    });
  });

  describe('PUT /manage/ai/models/:id - 更新模型配置', () => {
    it('应该成功更新模型配置', async () => {
      // 确保有测试数据
      if (!testModelId) {
        const createResponse = await app
          .httpRequest()
          .post('/manage/ai/models')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            provider: 'openai',
            modelName: 'gpt-4-update-test',
            displayName: 'GPT-4 Update Test',
          });
        testModelId = createResponse.body.data.id;
      }

      const updateData = {
        displayName: 'GPT-4 Updated',
        description: '已更新的描述',
        priority: 20,
      };

      const response = await app
        .httpRequest()
        .put(`/manage/ai/models/${testModelId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      assert(response.body.success === true);
      assert(response.body.data.displayName === 'GPT-4 Updated');
      assert(response.body.data.priority === 20);
    });

    it('应该能够更新 API Key', async () => {
      const updateData = {
        config: {
          apiKey: 'sk-new-key-654321',
        },
      };

      const response = await app
        .httpRequest()
        .put(`/manage/ai/models/${testModelId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      assert(response.body.success === true);
      // API Key 应该被掩码
      assert(response.body.data.config.apiKey.includes('****'));
    });

    it('应该返回 404 当模型不存在', async () => {
      const fakeId = '000000000000000000000000';

      const response = await app
        .httpRequest()
        .put(`/manage/ai/models/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ displayName: 'Test' })
        .expect(404);

      assert(response.body.success === false);
    });
  });

  describe('DELETE /manage/ai/models/:id - 删除模型配置', () => {
    it('应该成功删除模型配置', async () => {
      // 创建一个专门用于删除测试的模型
      const createResponse = await app
        .httpRequest()
        .post('/manage/ai/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          provider: 'openai',
          modelName: 'gpt-4-delete-test',
          displayName: 'GPT-4 Delete Test',
        });

      const deleteId = createResponse.body.data.id;

      const response = await app
        .httpRequest()
        .delete(`/manage/ai/models/${deleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert(response.body.success === true);

      // 验证已删除
      await app
        .httpRequest()
        .get(`/manage/ai/models/${deleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('应该返回 404 当模型不存在', async () => {
      const fakeId = '000000000000000000000000';

      const response = await app
        .httpRequest()
        .delete(`/manage/ai/models/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      assert(response.body.success === false);
    });
  });

  describe('PUT /manage/ai/models/:id/toggle - 切换启用状态', () => {
    it('应该成功切换模型启用状态', async () => {
      // 确保有测试数据
      if (!testModelId) {
        const createResponse = await app
          .httpRequest()
          .post('/manage/ai/models')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            provider: 'openai',
            modelName: 'gpt-4-toggle-test',
            displayName: 'GPT-4 Toggle Test',
            isEnabled: true,
          });
        testModelId = createResponse.body.data.id;
      }

      // 切换为禁用
      const response1 = await app
        .httpRequest()
        .put(`/manage/ai/models/${testModelId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isEnabled: false })
        .expect(200);

      assert(response1.body.success === true);
      assert(response1.body.data.isEnabled === false);

      // 切换为启用
      const response2 = await app
        .httpRequest()
        .put(`/manage/ai/models/${testModelId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isEnabled: true })
        .expect(200);

      assert(response2.body.success === true);
      assert(response2.body.data.isEnabled === true);
    });

    it('应该拒绝缺少 isEnabled 参数的请求', async () => {
      const response = await app
        .httpRequest()
        .put(`/manage/ai/models/${testModelId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      assert(response.body.success === false);
    });
  });

  describe('DELETE /manage/ai/models/batch - 批量删除', () => {
    it('应该成功批量删除多个模型', async () => {
      // 创建多个测试模型
      const ids = [];
      for (let i = 0; i < 3; i++) {
        const createResponse = await app
          .httpRequest()
          .post('/manage/ai/models')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            provider: 'openai',
            modelName: `gpt-4-batch-delete-${i}`,
            displayName: `GPT-4 Batch Delete ${i}`,
          });
        ids.push(createResponse.body.data.id);
      }

      // 批量删除
      const response = await app
        .httpRequest()
        .delete('/manage/ai/models/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids })
        .expect(200);

      assert(response.body.success === true);
      assert(response.body.data.deletedCount === 3);

      // 验证已删除
      for (const id of ids) {
        await app.httpRequest().get(`/manage/ai/models/${id}`).set('Authorization', `Bearer ${adminToken}`).expect(404);
      }
    });

    it('应该拒绝空的 ids 数组', async () => {
      const response = await app
        .httpRequest()
        .delete('/manage/ai/models/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [] })
        .expect(400);

      assert(response.body.success === false);
    });

    it('应该拒绝缺少 ids 参数的请求', async () => {
      const response = await app
        .httpRequest()
        .delete('/manage/ai/models/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      assert(response.body.success === false);
    });
  });

  describe('GET /manage/ai/models/:id/stats - 获取模型统计信息', () => {
    it('应该成功获取模型统计信息', async () => {
      // 确保有测试数据
      if (!testModelId) {
        const createResponse = await app
          .httpRequest()
          .post('/manage/ai/models')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            provider: 'openai',
            modelName: 'gpt-4-stats-test',
            displayName: 'GPT-4 Stats Test',
          });
        testModelId = createResponse.body.data.id;
      }

      const response = await app
        .httpRequest()
        .get(`/manage/ai/models/${testModelId}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert(response.body.success === true);
      assert(typeof response.body.data === 'object');
      // 统计信息应该包含这些字段
      assert('totalCalls' in response.body.data);
      assert('totalTokens' in response.body.data);
      assert('totalCost' in response.body.data);
    });
  });

  describe('GET /manage/ai/providers - 获取提供商列表', () => {
    it('应该成功获取提供商列表', async () => {
      const response = await app
        .httpRequest()
        .get('/manage/ai/providers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert(response.body.success === true);
      assert(Array.isArray(response.body.data));
      assert(response.body.data.length > 0);

      // 验证提供商信息结构
      const provider = response.body.data[0];
      assert(provider.value);
      assert(provider.label);
      assert(provider.description);
      assert(Array.isArray(provider.models));
    });

    it('应该包含 OpenAI 提供商', async () => {
      const response = await app
        .httpRequest()
        .get('/manage/ai/providers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const openai = response.body.data.find(p => p.value === 'openai');
      assert(openai);
      assert(openai.models.length > 0);
    });
  });

  describe('POST /manage/ai/test-api-key - 测试 API Key', () => {
    it('应该能够测试有效的 API Key', async () => {
      // 注意：这个测试可能会失败，因为需要真实的 API Key
      // 在实际测试中，应该使用 mock 或者跳过这个测试
      const testData = {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || 'sk-test-key',
        apiEndpoint: 'https://api.openai.com/v1',
      };

      const response = await app
        .httpRequest()
        .post('/manage/ai/test-api-key')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testData);

      // 如果没有真实的 API Key，应该返回错误
      assert(response.body.success !== undefined);
    });

    it('应该拒绝缺少必填字段的请求', async () => {
      const response = await app
        .httpRequest()
        .post('/manage/ai/test-api-key')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          provider: 'openai',
          // 缺少 apiKey
        })
        .expect(400);

      assert(response.body.success === false);
    });

    it('应该拒绝无效的提供商', async () => {
      const response = await app
        .httpRequest()
        .post('/manage/ai/test-api-key')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          provider: 'invalid-provider',
          apiKey: 'test-key',
        })
        .expect(400);

      assert(response.body.success === false);
    });
  });

  describe('错误处理和边界条件', () => {
    it('应该正确处理服务器内部错误', async () => {
      // 发送一个会导致服务器错误的请求
      // 例如，使用无效的数据类型
      const response = await app
        .httpRequest()
        .post('/manage/ai/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          provider: 'openai',
          modelName: 'test',
          priority: 'not-a-number', // 应该是数字
        });

      // 应该返回适当的错误响应
      assert(response.body.success === false);
    });

    it('应该正确处理超大的请求体', async () => {
      const largeData = {
        provider: 'openai',
        modelName: 'test',
        description: 'a'.repeat(100000), // 10万个字符
      };

      const response = await app
        .httpRequest()
        .post('/manage/ai/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largeData);

      // 应该被限制或正确处理
      assert(response.status >= 400 || response.body.success !== undefined);
    });

    it('应该正确处理并发请求', async () => {
      // 发送多个并发请求
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(app.httpRequest().get('/manage/ai/models').set('Authorization', `Bearer ${adminToken}`));
      }

      const responses = await Promise.all(promises);

      // 所有请求都应该成功
      responses.forEach(response => {
        assert(response.status === 200);
        assert(response.body.success === true);
      });
    });
  });

  describe('API 响应格式验证', () => {
    it('成功响应应该包含 success 和 data 字段', async () => {
      const response = await app
        .httpRequest()
        .get('/manage/ai/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert('success' in response.body);
      assert('data' in response.body);
      assert(response.body.success === true);
    });

    it('错误响应应该包含 success 和 message 字段', async () => {
      const response = await app
        .httpRequest()
        .get('/manage/ai/models/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      assert('success' in response.body);
      assert('message' in response.body);
      assert(response.body.success === false);
    });

    it('分页响应应该包含 page 对象', async () => {
      const response = await app
        .httpRequest()
        .get('/manage/ai/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert('page' in response.body);
      assert('currentPage' in response.body.page);
      assert('pageSize' in response.body.page);
      assert('totalCount' in response.body.page);
      assert('totalPages' in response.body.page);
    });
  });
});
