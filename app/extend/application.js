/*
 * @Author: doramart 
 * @Date: 2019-09-23 09:25:24 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-08-03 00:09:00
 */
'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const muri = require('muri');
const restore = require('@cdxoo/mongodb-restore')
const child = require('child_process');

require('module-alias/register')
const {
    siteFunc
} = require('@utils');

module.exports = {
    // 应用初始化
    async init(ctx) {
        let app = this;
        console.log('app init');
        try {
            let checkSystemInfo = await ctx.service.systemConfig.count();
            if (checkSystemInfo == 0) {
                const uri = app.config.mongoose.client.url;
                let datafile = path.join(__dirname, '../../databak/doracms2')
                await restore.database({
                    uri,
                    database: 'doracms2',
                    from: datafile
                });
            }
        } catch (error) {
            if (error && error.message == 'Invalid Operation, no operations specified') {
                console.log('init data success')
            } else {
                console.log('init data error:', error.message)
            }
        }
    },
    // 获取插件api白名单
    getExtendApiList() {
        let app = this;
        let pluginFile = path.join(app.config.baseDir, `config/plugin.js`);
        let pluginInfo = require(pluginFile);
        let plugins = [];
        let pluginAdminApiWhiteList = [];

        for (const pluginItem in pluginInfo) {

            // 1、开启插件，2、已成功加载，3、内部(dora)插件
            if (pluginInfo.hasOwnProperty(pluginItem) && pluginInfo[pluginItem].enable && !_.isEmpty(app.config[pluginItem]) && pluginItem.indexOf('dora') == 0) {

                let {
                    adminApi,
                } = app.config[pluginItem];

                // 获取后台接口白名单
                for (const item of adminApi) {
                    if (item.noPower && item.url) {
                        pluginAdminApiWhiteList.push(item.url);
                    }
                }

                plugins.push(pluginItem);

            }

        }
        return {
            plugins,
            adminApiWhiteList: pluginAdminApiWhiteList
        };
    },

    // 插件初始数据导入
    async initExtendData(ctx, pluginInfos = {}, type = 'install') {

        if (!_.isEmpty(pluginInfos)) {

            if (type == 'install') {

                let app = this;
                let targetPluginFolder = path.join(app.config.baseDir, `lib/plugin/${pluginInfos.pkgName}`);
                let tabname = path.basename(pluginInfos.initData, '.json')
                let dataPath = path.join(targetPluginFolder, `./app/db/${pluginInfos.initData}`);

                if (pluginInfos.initData && fs.existsSync(dataPath)) {
                    const parsedUri = muri(app.config.mongoose.client.url)
                    const parameters = []
                    if (parsedUri.auth) {
                        parameters.push(`-u "${parsedUri.auth.user}"`, `-p "${parsedUri.auth.pass}"`)
                    }
                    if (parsedUri.db) {
                        parameters.push(`-d "${parsedUri.db}"`)
                    }
                    let cmdstr = `${app.config.mongodb.binPath}mongoimport ${parameters.join(' ')} -c ${tabname} --upsert --drop "${dataPath}"`
                    child.execSync(cmdstr);
                }

            } else {
                // TODO 插件卸载暂不清除数据
                // await ctx.service[pluginInfos.alias].removeAll();

            }

        }


    },

    // 初始化资源管理数据
    async initResourceData(ctx, pluginInfos = {}, type = 'install') {

        if (!_.isEmpty(pluginInfos)) {

            let {
                alias,
                adminApi,
                iconName
            } = pluginInfos

            // 安装
            if (type == 'install') {

                let randomResource = await ctx.service.adminResource.item(ctx, {
                    query: {
                        parentId: '0'
                    },
                    files: '_id'
                })
                if (_.isEmpty(randomResource)) {
                    throw new Error(ctx.__('validate_error_params'));
                }

                let targetResourceId = randomResource._id;

                let sortId = 0;
                // 插入主菜单
                let thisParentId = await ctx.service.adminResource.create({
                    label: `${alias}Manage`,
                    type: '0',
                    api: '',
                    isExt: true,
                    parentId: targetResourceId,
                    sortId: 0,
                    routePath: alias,
                    icon: iconName,
                    componentPath: `${alias}/index`,
                    enable: true,
                    comments: `${pluginInfos.name}`,
                });

                for (const apiItem of adminApi) {
                    sortId++;
                    // 插入功能菜单
                    let ctrlName = (apiItem.controllerName).charAt(0).toUpperCase() + (apiItem.controllerName).slice(1)
                    await ctx.service.adminResource.create({
                        label: `${alias}${ctrlName}`,
                        type: '1',
                        api: apiItem.url,
                        isExt: true,
                        parentId: thisParentId,
                        sortId: sortId,
                        routePath: '',
                        icon: '',
                        componentPath: '',
                        enable: true,
                        comments: apiItem.details,
                    });
                }

            } else {

                let targetParentResource = await ctx.service.adminResource.item(ctx, {
                    query: {
                        routePath: alias,
                        label: `${alias}Manage`
                    }
                })
                if (!_.isEmpty(targetParentResource)) {
                    await ctx.service.adminResource.removes(ctx, targetParentResource._id, 'parentId');
                    await ctx.service.adminResource.removes(ctx, targetParentResource._id);
                }
            }

        }

    },

    // 添加插件配置
    async initPluginConfig(pluginInfos = {}, type = 'install') {
        if (!_.isEmpty(pluginInfos)) {
            let app = this;
            let configPluginPath = path.join(app.config.baseDir, `config/ext/config/${pluginInfos.alias}.js`);
            let extConfigPath = path.join(app.config.baseDir, `config/ext/plugin/${pluginInfos.alias}.js`);
            if (type == 'install') {

                if (pluginInfos.pluginsConfig) {
                    siteFunc.createFileByStr(extConfigPath, pluginInfos.pluginsConfig)
                }

                if (pluginInfos.defaultConfig) {

                    siteFunc.createFileByStr(configPluginPath, pluginInfos.defaultConfig)

                }

            } else {

                if (fs.existsSync(extConfigPath)) {
                    fs.unlinkSync(extConfigPath);
                }

                if (fs.existsSync(configPluginPath)) {
                    fs.unlinkSync(configPluginPath);
                }

            }


        }
    },

    // 初始化数据模型
    initExtendModel(modelsPath) {
        let app = this;
        fs.readdirSync(modelsPath).forEach(function (extendName) {
            if (extendName) {
                let filePath = `${modelsPath}/${extendName}`;
                if (fs.existsSync(filePath)) {
                    let modelKey = path.basename(extendName.charAt(0).toUpperCase() + extendName.slice(1), '.js');
                    if (_.isEmpty(app.model[modelKey])) {
                        let targetModel = app.loader.loadFile(filePath);
                        app.model[modelKey] = targetModel;
                    }
                }
            }
        });
    },

    // 初始化插件路由
    async initPluginRouter(ctx, pluginConfig = {}, pluginManageController = {}, pluginApiController = {}, next = {}) {

        let app = this;
        let isFontApi = false;
        let isAdminApi = false;
        let targetControllerName = '';
        let targetApiItem = {};
        if (!_.isEmpty(pluginConfig)) {

            if (!_.isEmpty(pluginConfig)) {
                let {
                    adminApi,
                    fontApi
                } = pluginConfig;

                let targetRequestUrl = ctx.request.url;

                if (targetRequestUrl.indexOf('/api/') >= 0) {

                    for (const fontApiItem of fontApi) {
                        let {
                            url,
                            method,
                            controllerName
                        } = fontApiItem;

                        let targetApi = targetRequestUrl.replace('/api/', '').split("?")[0];
                        if (ctx.request.method == method.toUpperCase() && targetApi === url && controllerName) {
                            isFontApi = true;
                            targetControllerName = controllerName;
                            targetApiItem = fontApiItem;
                            break;
                        }

                    }

                } else if (targetRequestUrl.indexOf('/manage/') >= 0) {

                    for (const adminApiItem of adminApi) {

                        let {
                            url,
                            method,
                            controllerName
                        } = adminApiItem;

                        let targetApi = targetRequestUrl.replace('/manage/', '').split("?")[0];
                        if (ctx.request.method == method.toUpperCase() && targetApi === url && controllerName) {
                            isAdminApi = true;
                            targetControllerName = controllerName;
                            targetApiItem = adminApiItem;
                            break;
                        }

                    }
                }

            }

        }

        if (isAdminApi && !_.isEmpty(pluginManageController) && targetControllerName) {
            await pluginManageController[targetControllerName](ctx, app);
        } else if (isFontApi && !_.isEmpty(pluginApiController) && targetControllerName) {
            if (targetApiItem.authToken) {
                if (ctx.session.logined) {
                    await pluginApiController[targetControllerName](ctx, app, next);
                } else {
                    ctx.helper.renderFail(ctx, {
                        message: ctx.__('label_notice_asklogin')
                    });
                }
            } else {
                await pluginApiController[targetControllerName](ctx, app, next);
            }
        }

    },

    // 添加钩子
    async hooks(ctx, hooks, params = {}) {
        try {

            let targetHook = await ctx.service.hook.item(ctx, {
                query: {
                    name: hooks
                },
                files: '_id'
            })

            if (!_.isEmpty(targetHook)) {

                // 暂时遍历开发环境插件列表
                // console.log('-----', app.config)
                // 通过钩子获取是哪个插件在挂载
                let plugins = await ctx.service.plugin.find({
                    isPaging: '0'
                }, {
                    query: {
                        state: true,
                        hooks: hooks
                    }
                })

                // console.log('--plugins--', plugins)

                if (!_.isEmpty(plugins)) {

                    // let targetPluginConfig = this.config.doraValine;
                    // let targetHook = await ctx.service[targetPluginConfig.alias].item(ctx, {
                    //     query: {
                    //         name: hooks
                    //     },
                    //     files: '_id'
                    // })
                    let targetPluginConfig = plugins[0];

                    let targetHtml = await this.hookRender(ctx, hooks, targetPluginConfig.alias, params);
                    // console.log('--targetHtml--', targetHtml)
                    if (targetHtml) {
                        ctx.locals['HOOK@' + hooks] = targetHtml;
                    }

                } else {
                    throw new Error(ctx.__('validate_error_params'));
                }

            } else {
                console.log('非法钩子')
            }

        } catch (error) {
            console.log('暂无插件挂载');
        }
    },

    // 插件渲染
    async hookRender(ctx, hookname, plugin, args) {

        try {
            let html = await ctx.helper.reqJsonData(`${plugin}/hookRender`, Object.assign({
                hookname
            }, args));
            return html;
        } catch (error) {
            return '';
        }

    }



};