'use strict';
module.exports = app => {
  const { router, controller } = app;
  const authAdminToken = app.middleware.authAdminToken({});

  // const authPage = app.middleware.authPage({});

  // 配置站点地图和robots抓取
  router.get('/sitemap.xml', controller.page.home.getSiteMapPage);

  router.get('/robots.txt', controller.page.home.getRobotsPage);

  // 🔧 Sitemap 管理 API
  router.get('/api/sitemap/cache-status', authAdminToken, controller.api.sitemap.cacheStatus);
  router.post('/api/sitemap/clear-cache', authAdminToken, controller.api.sitemap.clearCache);

  router.get(['/', '/zh-CN', '/en'], controller.page.home.getDataForIndexPage);

  router.get('/page/:current.html', controller.page.home.getDataForIndexPage);

  // 内容详情入口
  router.get('/details/:id.html', controller.page.home.getDataForContentDetails);

  // TODO 模板测试入口
  router.get('/nunjucks-template-test.html', controller.page.home.getDataForNunjucksTestPage);

  // TODO 模板测试入口 - 支持数据库类型参数
  router.get('/nunjucks-template-test/:db.html', controller.page.home.getDataForNunjucksTestPage);

  // 类别入口
  router.get(
    [
      '/:cate1?___:typeId?',
      '/:cate1?___:typeId?/:current.html',
      '/:cate0/:cate1?___:typeId?',
      '/:cate0/:cate1?___:typeId?/:current.html',
    ],
    controller.page.home.getDataForCatePage
  );

  // 搜索
  router.get(['/search/:searchkey', '/search/:searchkey/:current.html'], controller.page.home.getDataForSearchPage);
  // 标签
  router.get(['/tag/:tagName', '/tag/:tagName/:current.html'], controller.page.home.getDataForTagPage);
  // 作者
  router.get(['/author/:userId', '/author/:userId/:current.html'], controller.page.home.getDataForAuthorPage);

  router.get(['/404', '/404.html', '/500', '/500.html'], controller.page.home.getDataForErr);
};
