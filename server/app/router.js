'use strict';
module.exports = app => {
  // v1 API 路由
  require('./router/api/v1')(app);

  // 旧 API 路由（保留系统级API，已删除业务API）
  require('./router/api')(app);

  // 页面渲染路由
  require('./router/home')(app);
  require('./router/users')(app);
  require('./router/manage')(app);

  // 管理后台 v1 路由
  require('./router/manage/v1')(app);
};
