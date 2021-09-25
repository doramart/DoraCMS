'use strict';

const path = require('path');

const pluginConfigs = require('./ext/plugin');
// add you build-in plugin here, example:
exports.nunjucks = {
  enable: true,
  package: 'egg-view-nunjucks',
};

exports.mongoose = {
  enable: true,
  package: 'egg-mongoose',
};

exports.session = true;

exports.io = {
  enable: true,
  package: 'egg-socket.io',
};

exports.redis = {
  enable: false,
  package: 'egg-redis',
};

exports.doraBackUpData = {
  enable: true,
  package: 'egg-dora-backupdata',
  path: path.join(__dirname, '../lib/plugin/egg-dora-backupdata'),
};

exports.validate = {
  enable: true,
  package: 'egg-dora-validate',
};

exports.doraUploadFile = {
  enable: true,
  package: 'egg-dora-uploadfile',
};

// PLUGIN_NORMALPLUGIN_BEGIN

// doraRegUserPluginBegin
exports.doraRegUser = {
  enable: true,
  package: 'egg-dora-reguser',
  path: path.join(__dirname, '../lib/plugin/egg-dora-reguser'),
};
// doraRegUserPluginEnd

// doraAdsPluginBegin
exports.doraAds = {
  enable: true,
  package: 'egg-dora-ads',
  path: path.join(__dirname, '../lib/plugin/egg-dora-ads'),
};
// doraAdsPluginEnd

// doraAnnouncePluginBegin
exports.doraAnnounce = {
  enable: true,
  package: 'egg-dora-announce',
  path: path.join(__dirname, '../lib/plugin/egg-dora-announce'),
};
// doraAnnouncePluginEnd

// doraContentPluginBegin
exports.doraContent = {
  enable: true,
  package: 'egg-dora-content',
  path: path.join(__dirname, '../lib/plugin/egg-dora-content'),
};
// doraContentPluginEnd

// doraContentCategoryPluginBegin
exports.doraContentCategory = {
  enable: true,
  package: 'egg-dora-contentcategory',
  path: path.join(__dirname, '../lib/plugin/egg-dora-contentcategory'),
};
// doraContentCategoryPluginEnd

// doraContentMessagePluginBegin
exports.doraContentMessage = {
  enable: true,
  package: 'egg-dora-contentmessage',
  path: path.join(__dirname, '../lib/plugin/egg-dora-contentmessage'),
};
// doraContentMessagePluginEnd

// doraContentTagsPluginBegin
exports.doraContentTags = {
  enable: true,
  package: 'egg-dora-contenttags',
  path: path.join(__dirname, '../lib/plugin/egg-dora-contenttags'),
};
// doraContentTagsPluginEnd

// doraContentTempPluginBegin
exports.doraContentTemp = {
  enable: true,
  package: 'egg-dora-contenttemp',
  path: path.join(__dirname, '../lib/plugin/egg-dora-contenttemp'),
};
// doraContentTempPluginEnd

// doraHelpCenterPluginBegin
exports.doraHelpCenter = {
  enable: true,
  package: 'egg-dora-helpcenter',
  path: path.join(__dirname, '../lib/plugin/egg-dora-helpcenter'),
};
// doraHelpCenterPluginEnd

// doraSiteMessagePluginBegin
exports.doraSiteMessage = {
  enable: true,
  package: 'egg-dora-sitemessage',
  path: path.join(__dirname, '../lib/plugin/egg-dora-sitemessage'),
};
// doraSiteMessagePluginEnd

// doraSystemNotifyPluginBegin
exports.doraSystemNotify = {
  enable: true,
  package: 'egg-dora-systemnotify',
  path: path.join(__dirname, '../lib/plugin/egg-dora-systemnotify'),
};
// doraSystemNotifyPluginEnd

// doraSystemOptionLogPluginBegin
exports.doraSystemOptionLog = {
  enable: true,
  package: 'egg-dora-systemoptionlog',
  path: path.join(__dirname, '../lib/plugin/egg-dora-systemoptionlog'),
};
// doraSystemOptionLogPluginEnd

// doraTemplateConfigPluginBegin
exports.doraTemplateConfig = {
  enable: true,
  package: 'egg-dora-templateconfig',
  path: path.join(__dirname, '../lib/plugin/egg-dora-templateconfig'),
};
// doraTemplateConfigPluginEnd

// doraVersionManagePluginBegin
exports.doraVersionManage = {
  enable: true,
  package: 'egg-dora-versionmanage',
  path: path.join(__dirname, '../lib/plugin/egg-dora-versionmanage'),
};
// doraVersionManagePluginEnd

// doraMiddleStagePluginBegin
exports.doraMiddleStage = {
  enable: true,
  package: 'egg-dora-middlestage',
};
// doraMiddleStagePluginEnd

// doraMailTemplatePluginBegin
exports.doraMailTemplate = {
  enable: true,
  package: 'egg-dora-mailtemplate',
  path: path.join(__dirname, '../lib/plugin/egg-dora-mailtemplate'),
};
// doraMailTemplatePluginEnd

// doraMailDeliveryPluginBegin
exports.doraMailDelivery = {
  enable: true,
  package: 'egg-dora-maildelivery',
  path: path.join(__dirname, '../lib/plugin/egg-dora-maildelivery'),
};
// doraMailDeliveryPluginEnd

// PLUGIN_NORMALPLUGIN_END

for (const pluginItem in pluginConfigs) {
  if (pluginConfigs.hasOwnProperty(pluginItem)) {
    const element = pluginConfigs[pluginItem];
    exports[pluginItem] = element;
  }
}

// EGGPLUGINCONFIG
