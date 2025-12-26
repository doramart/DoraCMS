'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/service/webhook-integration.test.js', () => {
  let ctx;

  beforeEach(() => {
    ctx = app.mockContext();
  });

  describe('Content Service Webhook Integration', () => {
    it('should trigger webhook on content creation', async () => {
      // Mock webhook service
      let triggeredEvent = null;
      let triggeredPayload = null;

      ctx.service.webhook.triggerEvent = async (_event, _payload) => {
        triggeredEvent = _event;
        triggeredPayload = _payload;
      };

      // Create content
      const contentData = {
        title: 'Test Content',
        stitle: 'Test',
        type: '1',
        categories: [],
        tags: [],
        keywords: ['test'],
        sImg: '',
        state: '2',
        discription: 'Test description',
        comments: 'Test comments',
        simpleComments: 'Test simple comments',
        author: 'test-author-id',
      };

      await ctx.service.content.create(contentData);

      // Verify webhook was triggered
      assert(triggeredEvent === 'content.created');
      assert(triggeredPayload !== null);
      assert(triggeredPayload.title === 'Test Content');
    });

    it('should trigger webhook on content update', async () => {
      // Mock webhook service
      let triggeredEvent = null;

      ctx.service.webhook.triggerEvent = async (_event) => {
        triggeredEvent = _event;
      };

      // Mock update (we don't actually update, just verify the trigger logic)
      const originalUpdate = ctx.service.content.repository.update;
      ctx.service.content.repository.update = async (_id, _data) => {
        return {
          id: 'test-id',
          title: 'Updated Content',
          author: 'test-author',
          state: '2',
          updatedAt: new Date(),
        };
      };

      await ctx.service.content.update('test-id', { title: 'Updated Content' });

      // Restore original method
      ctx.service.content.repository.update = originalUpdate;

      // Verify webhook was triggered
      assert(triggeredEvent === 'content.updated');
    });

    it('should trigger webhook on content deletion', async () => {
      // Mock webhook service
      let triggeredEvent = null;

      ctx.service.webhook.triggerEvent = async (_event) => {
        triggeredEvent = _event;
      };

      // Mock remove
      const originalRemove = ctx.service.content.repository.remove;
      ctx.service.content.repository.remove = async (_ids, _key) => {
        return { deletedCount: 1 };
      };

      await ctx.service.content.remove('test-id');

      // Restore original method
      ctx.service.content.repository.remove = originalRemove;

      // Verify webhook was triggered
      assert(triggeredEvent === 'content.deleted');
    });
  });

  describe('User Service Webhook Integration', () => {
    it('should trigger webhook on user registration', async () => {
      // Mock webhook service
      let triggeredEvent = null;
      let triggeredPayload = null;

      ctx.service.webhook.triggerEvent = async (_event, _payload) => {
        triggeredEvent = _event;
        triggeredPayload = _payload;
      };

      // Mock create
      const originalCreate = ctx.service.user.repository.create;
      ctx.service.user.repository.create = async data => {
        return {
          id: 'test-user-id',
          userName: data.userName,
          email: data.email,
          phoneNum: data.phoneNum,
          createdAt: new Date(),
        };
      };

      await ctx.service.user.create({
        userName: 'testuser',
        email: 'test@example.com',
        phoneNum: '13800138000',
      });

      // Restore original method
      ctx.service.user.repository.create = originalCreate;

      // Verify webhook was triggered
      assert(triggeredEvent === 'user.registered');
      assert(triggeredPayload !== null);
      assert(triggeredPayload.userName === 'testuser');
    });

    it('should trigger webhook on user update', async () => {
      // Mock webhook service
      let triggeredEvent = null;

      ctx.service.webhook.triggerEvent = async (_event) => {
        triggeredEvent = _event;
      };

      // Mock update
      const originalUpdate = ctx.service.user.repository.update;
      ctx.service.user.repository.update = async (_id, _data) => {
        return {
          id: 'test-user-id',
          userName: 'updateduser',
          email: 'updated@example.com',
          phoneNum: '13800138000',
          updatedAt: new Date(),
        };
      };

      await ctx.service.user.update('test-user-id', { userName: 'updateduser' });

      // Restore original method
      ctx.service.user.repository.update = originalUpdate;

      // Verify webhook was triggered
      assert(triggeredEvent === 'user.updated');
    });

    it('should trigger webhook on user deletion', async () => {
      // Mock webhook service
      let triggeredEvent = null;

      ctx.service.webhook.triggerEvent = async (_event) => {
        triggeredEvent = _event;
      };

      // Mock remove
      const originalRemove = ctx.service.user.repository.remove;
      ctx.service.user.repository.remove = async (_ids, _key) => {
        return { deletedCount: 1 };
      };

      await ctx.service.user.remove('test-user-id');

      // Restore original method
      ctx.service.user.repository.remove = originalRemove;

      // Verify webhook was triggered
      assert(triggeredEvent === 'user.deleted');
    });
  });

  describe('Webhook Error Handling', () => {
    it('should not affect business logic when webhook fails', async () => {
      // Mock webhook service to throw error
      ctx.service.webhook.triggerEvent = async (_event, _payload) => {
        throw new Error('Webhook service unavailable');
      };

      // Mock create
      const originalCreate = ctx.service.content.repository.create;
      ctx.service.content.repository.create = async data => {
        return {
          id: 'test-content-id',
          title: data.title,
          author: data.author,
          state: data.state,
          createdAt: new Date(),
        };
      };

      // Should not throw error even if webhook fails
      const result = await ctx.service.content.create({
        title: 'Test Content',
        author: 'test-author',
        state: '2',
      });

      // Restore original method
      ctx.service.content.repository.create = originalCreate;

      // Verify content was created successfully
      assert(result !== null);
      assert(result.title === 'Test Content');
    });
  });
});
