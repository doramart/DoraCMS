'use strict';

// 提前加载环境变量，确保插件 enable 判断可用
require('./env');

const path = require('path');

const pluginConfigs = require('./ext/plugin');

// add you build-in plugin here, example:
exports.nunjucks = {
  enable: true,
  package: 'egg-view-nunjucks',
};

exports.mongoose = {
  enable: process.env.DATABASE_TYPE === 'mongodb',
  package: 'egg-mongoose',
};

exports.session = true;

// exports.io = {
//   enable: true,
//   package: 'egg-socket.io',
// };

exports.redis = {
  enable: true,
  package: 'egg-redis',
};

exports.doraValidate = {
  enable: true,
  package: 'egg-dora-validate',
  path: path.join(__dirname, '../lib/plugin/egg-dora-validate'),
};

// PLUGIN_NORMALPLUGIN_BEGIN

// doraMiddleStagePluginBegin
exports.doraMiddleStage = {
  enable: true,
  package: 'egg-dora-middlestage',
  path: path.join(__dirname, '../lib/plugin/egg-dora-middlestage'),
};
// doraMiddleStagePluginEnd

// PLUGIN_NORMALPLUGIN_END

for (const pluginItem in pluginConfigs) {
  if (pluginConfigs.hasOwnProperty(pluginItem)) {
    const element = pluginConfigs[pluginItem];
    exports[pluginItem] = element;
  }
}

// EGGPLUGINCONFIG

exports.static = true;

// exports.cors = {
//   enable: true,
//   package: 'egg-cors',
// };

exports.aiAssistant = {
  enable: true,
  path: path.join(__dirname, '../lib/plugin/egg-ai-assistant'),
};

// 🔥 Phase 1: Swagger API 文档插件
exports.swaggerdoc = {
  enable: true,
  package: 'egg-swagger-doc',
};
