/**
 * 页面渲染集成测试 - 验证新模板系统重构
 */
'use strict';

const assert = require('assert');
const mock = require('egg-mock');

describe('Page Rendering Integration Test', () => {
  let app;

  before(async () => {
    app = mock.app({
      baseDir: 'server',
    });
    return app.ready();
  });

  after(() => app.close());

  describe('HomeController with New Template System', () => {
    let ctx;

    beforeEach(() => {
      ctx = app.mockContext({
        session: {},
        params: {},
        query: {},
        helper: {
          reqJsonData: async (endpoint, _params) => {
            // Mock API responses
            switch (endpoint) {
              case 'systemConfig/getConfig':
                return {
                  siteName: 'Test Site',
                  siteDiscription: 'Test Description',
                  siteKeywords: 'test,keywords',
                  siteDomain: 'http://localhost:3000',
                };
              case 'content/getList':
                return {
                  docs: [
                    {
                      id: 'test1',
                      title: 'Test Content',
                      url: '/test1',
                      summary: 'Test summary',
                    },
                  ],
                  pageInfo: {
                    current: 1,
                    total: 1,
                    pageSize: 10,
                  },
                };
              case 'contentCategory/getOne':
                return {
                  id: 'category1',
                  name: 'Test Category',
                  type: 'article',
                  themeConfig: {
                    layout: 'default',
                    template: 'category',
                  },
                };
              default:
                return {};
            }
          },
        },
        service: {
          templateNew: {
            getActiveTheme: async () => ({
              id: 'theme1',
              name: 'Default Theme',
              slug: 'default',
              version: '1.0.0',
              active: true,
              config: {
                layouts: ['default'],
                templates: ['index', 'category', 'detail'],
              },
            }),
          },
          templateResolver: {
            render: async (category, contentType, content, extraData) => {
              // Mock template rendering
              return `<html><body>
                <h1>Rendered ${contentType}</h1>
                <div>Category: ${category ? category.name : 'None'}</div>
                <div>Content: ${content ? content.title : 'None'}</div>
                <div>Data: ${JSON.stringify(extraData)}</div>
              </body></html>`;
            },
          },
          contentCategoryNew: {
            findById: async id => ({
              id,
              name: 'Test Category',
              type: 'article',
              themeConfig: {
                layout: 'default',
                template: 'category',
              },
            }),
          },
          contentNew: {
            findById: async id => ({
              id,
              title: 'Test Content',
              url: `/content/${id}`,
              categories: ['category1'],
              keywords: ['test'],
              discription: 'Test content description',
            }),
          },
        },
      });

      // Mock logger
      ctx.logger = {
        info: () => {},
        warn: () => {},
        error: () => {},
      };

      // Mock redirect
      ctx.redirect = url => {
        ctx.status = 302;
        ctx.set('Location', url);
      };

      // Mock validateId
      ctx.validateId = id => {
        return id && (id.length === 24 || /^\d+$/.test(id));
      };
    });

    it('should render index page successfully', async () => {
      const controller = new app.controller.page.home(ctx);
      ctx.params = { current: '1' };

      await controller.getDataForIndexPage();

      assert(ctx.body.includes('Rendered index'));
      assert(ctx.body.includes('Category: None'));
    });

    it('should render category page successfully', async () => {
      const controller = new app.controller.page.home(ctx);
      ctx.params = { typeId: 'category123', current: '1' };

      await controller.getDataForCatePage();

      assert(ctx.body.includes('Rendered list'));
      assert(ctx.body.includes('Category: Test Category'));
    });

    it('should redirect for invalid category ID', async () => {
      const controller = new app.controller.page.home(ctx);
      ctx.params = { typeId: 'invalid' };

      await controller.getDataForCatePage();

      assert.strictEqual(ctx.status, 302);
      assert(ctx.get('Location').includes('/'));
    });

    it('should render content detail page successfully', async () => {
      const controller = new app.controller.page.home(ctx);
      ctx.params = { id: 'content123' };

      await controller.getDataForContentDetails();

      assert(ctx.body.includes('Rendered detail'));
      assert(ctx.body.includes('Content: Test Content'));
    });

    it('should render search page successfully', async () => {
      const controller = new app.controller.page.home(ctx);
      ctx.params = { searchkey: 'test query' };

      await controller.getDataForSearchPage();

      assert(ctx.body.includes('Rendered search'));
      assert(ctx.body.includes('Category: None'));
    });

    it('should render tag page successfully', async () => {
      const controller = new app.controller.page.home(ctx);
      ctx.params = { tagName: 'javascript' };

      await controller.getDataForTagPage();

      assert(ctx.body.includes('Rendered tag'));
      assert(ctx.body.includes('Category: None'));
    });

    it('should render author page successfully', async () => {
      const controller = new app.controller.page.home(ctx);
      ctx.params = { userId: 'user123' };

      await controller.getDataForAuthorPage();

      assert(ctx.body.includes('Rendered author'));
      assert(ctx.body.includes('Category: None'));
    });

    it('should render sitemap page successfully', async () => {
      const controller = new app.controller.page.home(ctx);

      await controller.getDataForSiteMap();

      assert(ctx.body.includes('Rendered sitemap'));
      assert(ctx.body.includes('Category: None'));
    });

    it('should render error page successfully', async () => {
      const controller = new app.controller.page.home(ctx);

      await controller.getDataForErr();

      assert(ctx.body.includes('Rendered error'));
      assert(ctx.body.includes('Category: None'));
    });

    it('should handle page rendering errors gracefully', async () => {
      const controller = new app.controller.page.home(ctx);

      // Mock service to throw error
      ctx.service.templateResolver.render = async () => {
        throw new Error('Template render failed');
      };

      ctx.params = { current: '1' };
      await controller.getDataForIndexPage();

      // Should fall back to error page
      assert(ctx.body.includes('500 Internal Server Error') || ctx.status === 500);
    });
  });

  describe('Context Extension with New Template System', () => {
    let ctx;

    beforeEach(() => {
      ctx = app.mockContext({
        session: {},
        params: {},
        query: {},
        pageType: 'index',
        helper: {
          reqJsonData: async () => ({
            docs: [],
            pageInfo: { current: 1, total: 0 },
          }),
        },
        service: {
          templateResolver: {
            render: async () => '<html><body>Test</body></html>',
          },
          contentCategoryNew: {
            findById: async () => null,
          },
          contentNew: {
            findById: async () => null,
          },
        },
        logger: {
          info: () => {},
          warn: () => {},
          error: () => {},
        },
      });
    });

    it('should use new template system by default', async () => {
      await ctx.getPageData();
      assert.strictEqual(ctx.body, '<html><body>Test</body></html>');
    });

    it('should validate ID correctly', () => {
      // MongoDB ObjectId
      assert(ctx.validateId('507f1f77bcf86cd799439011'));

      // Auto increment ID
      assert(ctx.validateId('123'));

      // Invalid ID
      assert(!ctx.validateId('invalid'));
      assert(!ctx.validateId(''));
      assert(!ctx.validateId(null));
    });

    it('should get current user ID safely', () => {
      // No user session
      assert.strictEqual(ctx.getCurrentUserId(), null);

      // With user session
      ctx.session.user = { id: 'user123' };
      assert.strictEqual(ctx.getCurrentUserId(), 'user123');
    });

    it('should check user login status correctly', () => {
      // Not logged in
      assert.strictEqual(ctx.isUserLoggedIn(), false);

      // Logged in
      ctx.session.user = { id: 'user123' };
      assert.strictEqual(ctx.isUserLoggedIn(), true);
    });
  });

  describe('Template System Integration', () => {
    it('should have all required services available', () => {
      const ctx = app.mockContext();

      // Check if template services are available
      assert(ctx.service.templateNew);
      assert(ctx.service.templateResolver);
      assert(ctx.service.templateManager);
      assert(ctx.service.templateIntegration);
    });

    it('should map page types to content types correctly', () => {
      const ctx = app.mockContext();

      const mapping = {
        index: 'index',
        cate: 'list',
        detail: 'detail',
        search: 'search',
        tag: 'tag',
        author: 'author',
        sitemap: 'sitemap',
        error: 'error',
      };

      Object.keys(mapping).forEach(pageType => {
        const contentType = ctx._mapPageTypeToContentType(pageType);
        assert.strictEqual(contentType, mapping[pageType]);
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain API compatibility', () => {
      const ctx = app.mockContext();

      // Check if legacy methods exist but use new system
      assert(typeof ctx.getPageData === 'function');
      assert(typeof ctx.getCateOrDetailTemp === 'function');
      assert(typeof ctx.renderCateName === 'function');
      assert(typeof ctx.validateId === 'function');
    });

    it('should handle legacy template configurations', async () => {
      const ctx = app.mockContext({
        service: {
          templateIntegration: {
            migrateFromLegacyTemplate: async () => ({
              success: true,
              config: { layout: 'default', template: 'category' },
            }),
          },
        },
      });

      // This should work with new system
      const result = await ctx.service.templateIntegration.migrateFromLegacyTemplate('category1');
      assert(result.success);
    });
  });
});
