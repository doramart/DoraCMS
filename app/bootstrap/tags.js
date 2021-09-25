/*
 * @Author: doramart
 * @Date: 2019-06-18 17:27:24
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 14:15:36
 */

'use strict';
const _ = require('lodash');
const nunjucks = require('nunjucks');
const jsPlugins = require('./plugin');

const _renderContentCtx = async (appCtx, context, args, actionType) => {
  const _ctx = context.ctx;
  let key = _.isEmpty(args.key) ? actionType : args.key;

  let api = 'content/getList';

  let queryObj = {};
  if (actionType === 'recommend') {
    queryObj = {
      model: '1',
      isPaging: '0',
    };
  } else if (actionType === 'hot') {
    queryObj = {
      sortby: '1',
      isPaging: '0',
    };
  } else if (actionType === 'news') {
    queryObj = {
      isPaging: '0',
    };
  } else if (actionType === 'random') {
    api = 'content/getRadomContents';
    queryObj = {
      isPaging: '0',
    };
  } else if (actionType === 'near_post') {
    api = 'content/getNearbyContent';
    queryObj = {
      id: args.id || _ctx.post._id,
    };
  } else if (actionType === 'tags') {
    api = 'contentTag/getList';
    queryObj = {
      isPaging: '0',
    };
  } else if (actionType === 'hottags') {
    api = 'contentTag/getHotList';
  } else if (actionType === 'ads') {
    api = 'ads/getOne';
    if (args.name) {
      key = args.name;
      queryObj = {
        name: args.name || '',
      };
    }
  } else if (actionType === 'navtree') {
    api = 'contentCategory/getTreelist';
  } else if (actionType === 'childnav') {
    api = 'contentCategory/getCurrentCategoriesById';
  }

  const typeId = args.typeId ? args.typeId : false;
  const pageSize = args.pageSize ? args.pageSize : 10;
  const isPaging = args.isPaging ? args.isPaging : '1';

  let apiData = [];

  if (!key || !api) {
    throw new Error(context.ctx.__('validate_error_params'));
  }

  const payload = {};

  if (typeId) {
    payload.typeId = typeId;
  }

  if (pageSize) {
    payload.pageSize = pageSize;
  }

  if (isPaging) {
    payload.isPaging = isPaging;
  }

  if (queryObj) {
    _.assign(payload, queryObj);
  }

  // console.log(actionType, '--payload--', payload)
  apiData = await appCtx.helper.reqJsonData(api, payload);

  context.ctx[key] = apiData;
};

// api调用
global.remote = function (appCtx) {
  this.tags = ['remote'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  };

  this.run = async (context, args, callback) => {
    const key = _.isEmpty(args.key) ? false : args.key;
    // console.log('---key--', key);
    try {
      const api = _.isEmpty(args.api) ? false : args.api;
      const queryObj = _.isEmpty(args.query) ? false : JSON.parse(args.query);
      const pageSize = _.isEmpty(args.pageSize) ? false : args.pageSize;
      const isPaging = _.isEmpty(args.isPaging) ? '1' : args.isPaging;

      let apiData = [];

      if (!key || !api) {
        throw new Error(context.ctx.__('validate_error_params'));
      }

      const payload = {};

      if (pageSize) {
        payload.pageSize = pageSize;
      }

      if (isPaging) {
        payload.isPaging = isPaging;
      }

      if (queryObj) {
        _.assign(payload, queryObj);
      }

      apiData = await appCtx.helper.reqJsonData(api, payload);
      // console.log(payload, '--apiData--', apiData);
      context.ctx[key] = apiData;
      return callback(null, '');
    } catch (error) {
      context.ctx[key] = [];
      return callback(null, '');
    }
  };
};

// 最新文档
global.news = function (appCtx) {
  this.tags = ['news'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  };

  this.run = async (context, args, callback) => {
    try {
      await _renderContentCtx(appCtx, context, args, 'news');
      return callback(null, '');
    } catch (error) {
      // context.ctx[key] = [];
      return callback(null, '');
    }
  };
};

// 推荐文档
global.recommend = function (appCtx) {
  this.tags = ['recommend'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  };

  this.run = async (context, args, callback) => {
    try {
      await _renderContentCtx(appCtx, context, args, 'recommend');
      return callback(null, '');
    } catch (error) {
      return callback(null, '');
    }
  };
};

// 热门文档
global.hot = function (appCtx) {
  this.tags = ['hot'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  };

  this.run = async (context, args, callback) => {
    try {
      await _renderContentCtx(appCtx, context, args, 'hot');
      return callback(null, '');
    } catch (error) {
      // context.ctx[key] = [];
      return callback(null, '');
    }
  };
};

// 随机文档
global.random = function (appCtx) {
  this.tags = ['random'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  };

  this.run = async (context, args, callback) => {
    try {
      await _renderContentCtx(appCtx, context, args, 'random');
      return callback(null, '');
    } catch (error) {
      return callback(null, '');
    }
  };
};

// 标签
global.tags = function (appCtx) {
  this.tags = ['tags'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  };

  this.run = async (context, args, callback) => {
    try {
      await _renderContentCtx(appCtx, context, args, 'tags');
      return callback(null, '');
    } catch (error) {
      return callback(null, '');
    }
  };
};
// 热门标签
global.hottags = function (appCtx) {
  this.tags = ['hottags'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  };

  this.run = async (context, args, callback) => {
    try {
      await _renderContentCtx(appCtx, context, args, 'hottags');
      return callback(null, '');
    } catch (error) {
      return callback(null, '');
    }
  };
};

// 广告
global.ads = function (appCtx) {
  this.tags = ['ads'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  };

  this.run = async (context, args, callback) => {
    try {
      await _renderContentCtx(appCtx, context, args, 'ads');
      return callback(null, '');
    } catch (error) {
      return callback(null, '');
    }
  };
};

// 具有父子关系的分类列表
global.navtree = function (appCtx) {
  this.tags = ['navtree'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  };

  this.run = async (context, args, callback) => {
    try {
      await _renderContentCtx(appCtx, context, args, 'navtree');
      return callback(null, '');
    } catch (error) {
      return callback(null, '');
    }
  };
};

// 指定类别下的子类
global.childnav = function (appCtx) {
  this.tags = ['childnav'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  };

  this.run = async (context, args, callback) => {
    try {
      await _renderContentCtx(appCtx, context, args, 'childnav');
      return callback(null, '');
    } catch (error) {
      return callback(null, '');
    }
  };
};

// 上下篇文档
global.near_post = function (appCtx) {
  this.tags = ['near_post'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  };

  this.run = async (context, args, callback) => {
    try {
      await _renderContentCtx(appCtx, context, args, 'near_post');
      return callback(null, '');
    } catch (error) {
      return callback(null, '');
    }
  };
};

// 头部
global.HeaderExtension = function () {
  this.tags = ['header'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken(); // Get the tag token

    // Parse the args and move after the block end.
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    // Parse the body
    const body = parser.parseUntilBlocks('header', 'endheader');
    parser.advanceAfterBlockEnd();

    // Actually do work on block body and arguments
    return new nodes.CallExtension(this, 'run', args, [body]);
  };

  this.run = function (context, args, bodyCallback) {
    const params = !_.isEmpty(args) ? args : {};
    const _ctx = context.ctx;
    const rawCode = bodyCallback ? bodyCallback() : '';
    const metaArr = [];

    metaArr.push('<meta charset="utf-8">');
    metaArr.push(`<title>${_ctx.site.title}</title>`);
    metaArr.push(
      '<meta name="viewport" content="width=device-width, initial-scale=1">'
    );
    metaArr.push(
      `<meta name="description" content="${_ctx.site.discription}">`
    );
    metaArr.push(`<meta content="${_ctx.site.key}" name="keywords" />`);
    metaArr.push('<meta property="og:type" content="website" />');
    metaArr.push(`<meta property="og:title" content="${_ctx.site.title}" />`);
    metaArr.push(
      `<meta property="og:description" content="${_ctx.site.discription}" />`
    );
    metaArr.push(`<meta property="og:image" content="${_ctx.ogData.img}">`);
    metaArr.push(`<meta property="og:url" content="${_ctx.ogData.url}">`);
    metaArr.push('<meta name="author" content="DoraCMS">');

    // 默认插件支持
    metaArr.push(
      `<script src="${_ctx.staticRootPath}/plugins/avalon.js/2.2.7/avalon.min.js?version=${_ctx.site.version}"></script>`
    );
    metaArr.push(
      `<script src="${_ctx.staticRootPath}/plugins/jquery/1.10.2/jquery.min.js?version=${_ctx.site.version}"></script>`
    );
    metaArr.push(
      `<script src="${_ctx.staticRootPath}/plugins/layer/layer.js?version=${_ctx.site.version}"></script>`
    );
    metaArr.push(
      `<script src="${_ctx.staticRootPath}/themes/users/js/dora.front.js?version=${_ctx.site.version}"></script>\n`
    );
    metaArr.push(
      `<link rel="stylesheet" href="${_ctx.staticRootPath}/plugins/layer/theme/default/layer.css">`
    );

    if (params.adaptor === 'ie') {
      metaArr.push('<!--[if lt IE 9]>');
      metaArr.push(
        `<script src="${_ctx.staticRootPath}/plugins/html5shiv/3.7.2/html5shiv.min.js"></script>`
      );
      metaArr.push(
        `<script src="${_ctx.staticRootPath}/plugins/respond.js/1.4.2/respond.min.js"></script>`
      );
      metaArr.push(
        `<script src="${_ctx.staticRootPath}/plugins/json3/3.3.2/json3.min.js"></script>`
      );
      metaArr.push(
        `<script src="${_ctx.staticRootPath}/plugins/promise/promise.js"></script>`
      );
      metaArr.push('<![endif]-->');
    } else if (params.adaptor === 'modernizr') {
      metaArr.push(
        `<script src="${_ctx.staticRootPath}/plugins/modernizr/modernizr.js"></script>`
      );
    }

    if (_ctx.site.router === 'users') {
      metaArr.push(
        `<link rel="stylesheet" href="${_ctx.staticRootPath}/plugins/font-awesome/4.7.0/css/font-awesome.min.css">`
      );
      metaArr.push(
        `<link rel="stylesheet" href="${_ctx.staticRootPath}/plugins/twitter-bootstrap/3.3.5/css/bootstrap.min.css?version=${_ctx.site.version}">\n`
      );
      metaArr.push(
        `<link rel="stylesheet" href="${_ctx.staticRootPath}/themes/users/css/white.css?version=${_ctx.site.version}">\n`
      );
      metaArr.push(
        `<script src="${_ctx.staticRootPath}/themes/users/js/avalon-ms-pager.js?version=${_ctx.site.version}"></script>\n`
      );
    }

    metaArr.push(rawCode);
    let metaStr = metaArr.join('\n');

    if (_ctx.site.configs.statisticalCode) {
      metaStr += '\n';
      metaStr += `
            <script>
                var _hmt = _hmt || [];
                (function () {
                    var hm = document.createElement("script");
                    hm.src = "${_ctx.site.configs.statisticalCode}";
                    var s = document.getElementsByTagName("script")[0];
                    s.parentNode.insertBefore(hm, s);
                })();
            </script>
            `;
    }
    return new nunjucks.runtime.SafeString(metaStr);
  };
};

// 静态资源
global.AssetsExtension = function () {
  this.tags = ['assets'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken(); // Get the tag token

    // Parse the args and move after the block end.
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    // Parse the body
    const body = parser.parseUntilBlocks('assets', 'endassets');
    parser.advanceAfterBlockEnd();

    // Actually do work on block body and arguments
    return new nodes.CallExtension(this, 'run', args, [body]);
  };

  this.run = function (context, args, bodyCallback) {
    const _ctx = context.ctx;
    const assetsSource = args ? args : '';
    // const assetsType = args.type;
    const assetsKeyArr = assetsSource.split(' ');
    // console.log('--_ctx--', _ctx)
    const rawCode = bodyCallback();
    let assetsStr = '';
    const assetsPath = `${_ctx.staticThemePath}`;

    for (const item of assetsKeyArr) {
      const fileExtension = item.split('.').pop();
      if (fileExtension !== 'js' && fileExtension !== 'css') {
        continue;
      }
      let targetPath = '';
      if (item.indexOf('/') >= 1) {
        targetPath = `${_ctx.staticRootPath}/${item}`;
      } else {
        targetPath = `${assetsPath}/${fileExtension}/${item}`;
      }
      if (fileExtension === 'js') {
        assetsStr += `<script src="${targetPath}?version=${_ctx.site.version}"></script>\n`;
      } else if (fileExtension === 'css') {
        assetsStr += `<link href="${targetPath}?version=${_ctx.site.version}" rel="stylesheet">\n`;
      }
    }

    if (rawCode) {
      assetsStr += `\n
            ${rawCode}
            `;
    }

    return new nunjucks.runtime.SafeString(assetsStr);
  };
};

// js 插件
global.PluginsExtension = function () {
  this.tags = ['plugin'];

  this.parse = function (parser, nodes) {
    const tok = parser.nextToken(); // Get the tag token

    // Parse the args and move after the block end.
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    // Parse the body
    const body = parser.parseUntilBlocks('plugin', 'endplugin');
    parser.advanceAfterBlockEnd();

    // Actually do work on block body and arguments
    return new nodes.CallExtension(this, 'run', args, [body]);
  };

  this.run = function (context, args, bodyCallback) {
    const _ctx = context.ctx;
    const rawCode = bodyCallback();
    let assetsStr = '';
    let pluginName = args.name ? args.name : '';

    if (!pluginName) {
      return '';
    }
    pluginName = pluginName.split(' ');

    for (const pluginItem of pluginName) {
      const assetsKeyArr = jsPlugins[pluginItem];

      for (const item of assetsKeyArr) {
        const fileExtension = item.split('.').pop();
        if (fileExtension !== 'js' && fileExtension !== 'css') {
          continue;
        }
        const targetPath = `${_ctx.staticRootPath}/plugins/${pluginItem}/${item}`;

        if (fileExtension === 'js') {
          assetsStr += `<script src="${targetPath}?version=${_ctx.site.version}"></script>\n`;
        } else if (fileExtension === 'css') {
          assetsStr += `<link href="${targetPath}?version=${_ctx.site.version}" rel="stylesheet">\n`;
        }
      }
    }

    if (rawCode) {
      assetsStr += `\n
            ${rawCode}
            `;
    }

    return new nunjucks.runtime.SafeString(assetsStr);
  };
};
