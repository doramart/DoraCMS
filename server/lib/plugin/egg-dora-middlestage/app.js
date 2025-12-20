const path = require('path');
class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  beforeStart() {}

  configWillLoad() {
    this.app.config.middleware.push('middleStageRouter');
  }

  async didLoad() {}

  async willReady() {}
}

module.exports = AppBootHook;
