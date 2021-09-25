'use strict';
const path = require('path');
class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  beforeStart() {}

  configWillLoad() {
    this.app.config.middleware.push('contentTemplateRouter');
  }

  async didLoad() {
    // 数据模型初始化
    const modelsPath = path.resolve(__dirname, './app/model');
    this.app.initExtendModel(modelsPath);

    // console.log('----2222-', this.app.config.doraContentTemp);
  }

  async willReady() {}
}

module.exports = AppBootHook;
