/**
 * Template Controller - 管理后台模板管理
 * 基于新的Template模块和Repository模式
 */
'use strict';

const { templateRule } = require('../../validate');
const rules = templateRule.templateRule;
const _ = require('lodash');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const TemplateController = {
  _resolveSafeThemeTempDir(alias) {
    const path = require('path');

    if (!alias || typeof alias !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(alias.trim())) {
      throw new Error('invalid template alias');
    }

    const baseDir = path.resolve(this.app.config.temp_view_forder);
    const normalizedAlias = alias.trim();
    const downloadDir = path.resolve(baseDir, normalizedAlias);

    if (downloadDir !== baseDir && !downloadDir.startsWith(baseDir + path.sep)) {
      throw new Error('invalid template alias');
    }

    return {
      alias: normalizedAlias,
      downloadDirWithSep: `${downloadDir}${path.sep}`,
    };
  },

  /**
   * 获取模板主题列表
   * @param ctx
   */
  async list(ctx) {
    const { query } = ctx.request;

    // 构建查询条件
    const filters = {};

    if (query.status) {
      filters.status = { $eq: query.status };
    }

    if (query.active !== undefined) {
      filters.active = { $eq: query.active === 'true' || query.active === true };
    }

    if (query.installed !== undefined) {
      filters.installed = { $eq: query.installed === 'true' || query.installed === true };
    }

    // 设置查询选项
    const options = {
      filters,
      fields: [
        'id',
        'name',
        'slug',
        'version',
        'author',
        'description',
        'screenshot',
        'active',
        'installed',
        'stats',
        'createdAt',
        'isSystemTemplate',
      ],
      sort: [
        { field: 'active', order: 'desc' },
        { field: 'createdAt', order: 'desc' },
      ],
      searchKeys: ['name', 'slug', 'author', 'description'],
    };

    // 添加搜索条件
    if (query.searchkey) {
      query.searchkey = query.searchkey.trim();
    }

    const result = await ctx.service.template.find(query, options);
    ctx.helper.renderSuccess(ctx, { data: result });
  },

  /**
   * 获取单个模板主题详情
   * @param ctx
   */
  async getOne(ctx) {
    const { id } = ctx.params;

    const template = await ctx.service.template.findById(id);

    if (!template) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.notFound') });
    }

    // 获取主题完整性检查结果
    let integrityCheck = null;
    try {
      integrityCheck = await ctx.service.templateManager.checkThemeIntegrity(id);
    } catch (error) {
      ctx.logger.warn(`Failed to check theme integrity: ${error.message}`);
    }

    ctx.helper.renderSuccess(ctx, {
      data: {
        ...template,
        integrityCheck,
      },
    });
  },

  /**
   * 创建模板主题
   * @param ctx
   */
  async addOne(ctx) {
    ctx.validate(rules.addOne);

    const { name, slug, version, author, description, config } = ctx.request.body;

    // 业务验证 - Repository会自动抛出具体异常
    await ctx.service.template.checkSlugUnique(slug);

    const template = await ctx.service.template.create({
      name,
      slug,
      version: version || '1.0.0',
      author: author || 'doramart',
      description,
      config: config || {},
      createBy: ctx.session.adminUserInfo?.id,
    });

    ctx.helper.renderSuccess(ctx, { data: template });
  },

  /**
   * 更新模板主题
   * @param ctx
   */
  async updateOne(ctx) {
    ctx.validate(rules.updateOne);

    const { id } = ctx.params;
    const updateData = ctx.request.body;

    // 业务验证 - 更新时检查唯一性
    if (updateData.slug) {
      await ctx.service.template.checkSlugUnique(updateData.slug, id);
    }

    const template = await ctx.service.template.update(id, {
      ...updateData,
      updateBy: ctx.session.adminUserInfo?.id,
    });

    ctx.helper.renderSuccess(ctx, { data: template });
  },

  /**
   * 删除模板主题
   * @param ctx
   */
  async deleteOne(ctx) {
    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('template.fields.name'),
    });

    const id = idsArray[0]; // 单个删除只取第一个ID

    const template = await ctx.service.template.findById(id);
    if (!template) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.notFound') });
    }

    // 检查是否为激活主题
    if (template.active) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.deleteActiveForbidden') });
    }

    // 检查是否为系统模板
    if (template.isSystemTemplate) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.deleteSystemForbidden') });
    }

    await ctx.service.template.remove(id);

    ctx.helper.renderSuccess(ctx, {
      message: ctx.__('common.messages.deleteSuccess', [ctx.__('template.label')]),
    });
  },

  /**
   * 批量删除模板主题
   * @param ctx
   */
  async deleteMany(ctx) {
    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('template.fields.name'),
    });

    // 检查是否包含激活主题或默认主题
    const templates = await Promise.all(idsArray.map(id => ctx.service.template.findById(id)));

    const activeThemes = templates.filter(t => t && t.active);
    if (activeThemes.length > 0) {
      return ctx.helper.renderFail(ctx, {
        message: ctx.__('template.error.deleteActiveList', [activeThemes.map(t => t.name).join(', ')]),
      });
    }

    const systemTemplates = templates.filter(t => t && t.isSystemTemplate);
    if (systemTemplates.length > 0) {
      return ctx.helper.renderFail(ctx, {
        message: ctx.__('template.error.deleteSystemList', [systemTemplates.map(t => t.name).join(', ')]),
      });
    }

    const result = await ctx.service.template.remove(idsArray);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: ctx.__('template.message.deleteCountSuccess', [result.deletedCount]),
    });
  },

  /**
   * 激活模板主题
   * @param ctx
   */
  async activate(ctx) {
    const { id } = ctx.params;

    const result = await ctx.service.templateManager.activateTheme(id);

    ctx.helper.renderSuccess(ctx, {
      data: result.theme,
      message: result.message,
    });
  },

  /**
   * 停用模板主题
   * @param ctx
   */
  async deactivate(ctx) {
    const { id } = ctx.params;

    const result = await ctx.service.templateManager.deactivateTheme(id);

    ctx.helper.renderSuccess(ctx, {
      data: result.theme,
      message: result.message,
    });
  },

  /**
   * 获取当前激活的主题
   * @param ctx
   */
  async getActiveTheme(ctx) {
    const activeTheme = await ctx.service.template.getActiveTheme();

    if (!activeTheme) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.noActiveTheme') });
    }

    ctx.helper.renderSuccess(ctx, { data: activeTheme });
  },

  /**
   * 安装主题包（模板上传）
   * @param ctx
   */
  async install(ctx) {
    const stream = await ctx.getFileStream();
    // 所有表单字段都能通过 `stream.fields` 获取到
    const filename = require('path').basename(stream.filename); // 文件名称
    const extname = require('path').extname(stream.filename).toLowerCase(); // 文件扩展名称

    // 组装参数 model
    const attachment = {};
    attachment.extname = extname || 'hello';
    attachment.filename = filename;

    const forderName = filename.split('.')[0];
    const target_path = this.app.config.temp_view_forder + forderName + '.zip';
    const DOWNLOAD_DIR = this.app.config.temp_view_forder + forderName + '/';

    const writeStream = require('fs').createWriteStream(target_path);
    const sendToWormhole = require('stream-wormhole');
    const awaitWriteStream = require('await-stream-ready').write;
    const fs = require('fs');
    const unzip = require('node-unzip-2');
    const iconv = require('iconv-lite');
    const path = require('path');
    const _ = require('lodash');

    // 文件处理，上传到云存储等等
    try {
      await awaitWriteStream(stream.pipe(writeStream));

      if (fs.existsSync(DOWNLOAD_DIR)) {
        await ctx.helper.deleteFolder(target_path);
        throw new Error(ctx.__('template.error.duplicateUpload'));
      }

      const realType = ctx.helper.getFileMimeType(target_path);
      if (realType.fileType !== 'zip') {
        fs.unlinkSync(target_path);
        throw new Error(ctx.__('template.error.invalidFileType'));
      }

      const extractState = () => {
        return new Promise((resolve, reject) => {
          fs.mkdirSync(DOWNLOAD_DIR);
          // 下载完成后解压缩
          const extract = unzip.Extract({
            path: DOWNLOAD_DIR,
          });
          extract.on('error', function (err) {
            console.log(err);
            // 解压异常处理
            reject(new Error(err));
          });
          extract.on('finish', async function () {
            console.log('解压完成!!');

            try {
              // 解压完成检查文件是否完整
              const checkResult = await TemplateController._checkTemplateStructure.call(
                { app: this.app, ctx },
                DOWNLOAD_DIR,
                forderName
              );

              if (!checkResult.success) {
                throw new Error(checkResult.message + ': ' + (checkResult.errors?.join(', ') || ''));
              }

              const targetForder = forderName;
              const tempForder = this.app.config.temp_view_forder + targetForder;

              // 读取标准格式的theme.json配置文件
              const configPath = tempForder + '/theme.json';

              if (!fs.existsSync(configPath)) {
                throw new Error(ctx.__('template.error.configFileMissing'));
              }

              let tempInfoData = null;
              try {
                const configContent = fs.readFileSync(configPath, 'utf8');
                const parsedConfig = JSON.parse(configContent);

                // 标准化配置格式
                tempInfoData = TemplateController._normalizeTemplateConfig(parsedConfig);
              } catch (parseError) {
                throw new Error(`配置文件解析失败: ${parseError.message}`);
              }

              // 验证必需的配置字段
              if (
                !tempInfoData ||
                !tempInfoData.name ||
                !tempInfoData.alias ||
                !tempInfoData.version ||
                !tempInfoData.author ||
                !tempInfoData.comment
              ) {
                throw new Error(ctx.__('template.error.invalidConfig'));
              }

              const validateTempInfo = ctx.helper.checkTempInfo(tempInfoData, targetForder);
              if (validateTempInfo !== 'success') {
                throw new Error('extract failed: ' + validateTempInfo);
              }

              // 检查模板是否已存在（通过slug和name检查）
              await ctx.service.template.checkSlugUnique(tempInfoData.alias);
              await ctx.service.template.checkNameUnique(tempInfoData.name);

              // 复制静态文件到公共目录
              const temp_static_forder = this.app.config.temp_static_forder;
              const fromPath = this.app.config.temp_view_forder + targetForder + '/assets/';
              const targetPath = temp_static_forder + targetForder;
              const targetAssetPath = path.join(this.app.config.baseDir, `app/assets/${targetForder}`);

              // 使用新的文件结构，从assets目录拷贝
              if (fs.existsSync(fromPath)) {
                ctx.helper.copyForder(fromPath, targetPath);
                ctx.helper.copyForder(fromPath, targetAssetPath);
              }

              // 🎯 统一使用TemplateManager的安装方法
              const themePackage = {
                name: tempInfoData.name,
                slug: tempInfoData.alias,
                version: tempInfoData.version,
                author: tempInfoData.author,
                description: tempInfoData.comment,
                screenshot: this.app.config.static.prefix + '/themes/' + targetForder + '/screenshot-desktop.jpg',
                config: tempInfoData.config || {},
                stats: {
                  downloadCount: 0,
                  rating: 0,
                  reviewCount: 0,
                },
              };

              const installResult = await ctx.service.templateManager.installTheme(
                themePackage,
                tempForder // 传递解压后的目录路径
              );

              ctx.logger.info(`Theme installation completed: ${installResult.theme.slug}`);

              await ctx.helper.deleteFolder(tempForder + '.zip');
              resolve();
            } catch (err) {
              const tempForder = this.app.config.temp_view_forder + forderName;
              await ctx.helper.deleteFolder(tempForder);
              await ctx.helper.deleteFolder(tempForder + '.zip');
              reject(err);
            }
          });
          fs.createReadStream(target_path).pipe(extract);
        });
      };

      await extractState();

      ctx.helper.renderSuccess(ctx, {
        data: {},
        message: ctx.__('template.message.uploadInstallSuccess'),
      });
    } catch (err) {
      // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
      await sendToWormhole(stream);
      ctx.helper.renderFail(ctx, {
        message: err.message || err,
      });
    }
  },

  /**
   * 远程下载安装主题
   * @param ctx
   */
  async installFromRemote(ctx) {
    const tempId = ctx.request.body.tempId;
    const singleUserToken = ctx.request.body.singleUserToken;
    const { templateConfig: siteFunc } = require('../../utils');
    const url = require('url');
    const fs = require('fs');
    const _ = require('lodash');

    let tempObj = {};
    try {
      if (tempId) {
        const templateInfo = await ctx.helper.reqJsonData(this.app.config.doracms_api + '/api/cmsTemplate/getOne', {
          id: tempId,
          singleUserToken,
          authUser: '1',
        });

        if (!_.isEmpty(templateInfo)) {
          tempObj = templateInfo;
          if (_.isEmpty(tempObj)) {
            throw new Error(ctx.__('validation.errorParams'));
          }
          const file_url = tempObj.filePath;
          const { downloadDirWithSep: DOWNLOAD_DIR } = TemplateController._resolveSafeThemeTempDir.call(this, tempObj.alias);
          const target_path = DOWNLOAD_DIR + url.parse(file_url).pathname.split('/').pop();

          // 检查模板是否已存在
          const existingTemplate = await ctx.service.template.findBySlug(tempObj.alias);
          if (existingTemplate) {
            throw new Error(ctx.__('template.error.alreadyInstalled'));
          }

          // 清理旧的目录（如果存在）- 必须在下载之前
          if (fs.existsSync(DOWNLOAD_DIR)) {
            try {
              ctx.logger.info(`Cleaning existing directory before download: ${DOWNLOAD_DIR}`);
              fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
              ctx.logger.info(`Successfully cleaned directory: ${DOWNLOAD_DIR}`);
            } catch (cleanError) {
              ctx.logger.error(`Failed to clean directory: ${DOWNLOAD_DIR}`, cleanError);
              throw new Error(`清理旧目录失败: ${cleanError.message}`);
            }
          }

          // 文件下载
          await siteFunc.downloadTempFile(ctx, file_url, DOWNLOAD_DIR);

          // 文件解压和处理
          const tempAlias = await TemplateController._extractAndProcessTemplate(
            ctx,
            DOWNLOAD_DIR,
            target_path,
            tempObj,
            'create'
          );

          // 资源拷贝
          // await siteFunc.copyThemeToStaticForder(ctx, this.app, tempAlias, DOWNLOAD_DIR);

          ctx.helper.renderSuccess(ctx, {
            message: ctx.__('template.message.remoteInstallSuccess'),
          });
        } else {
          throw new Error('install error');
        }
      } else {
        throw new Error(ctx.__('validation.errorParams'));
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err.message || err,
      });
    }
  },

  /**
   * 提取和处理模板文件的辅助方法
   * @param {Object} ctx
   * @param {String} DOWNLOAD_DIR
   * @param {String} target_path
   * @param {Object} tempObj
   * @param {String} installType
   * @return {Promise<String>} tempAlias
   * @private
   */
  async _extractAndProcessTemplate(ctx, DOWNLOAD_DIR, target_path, tempObj, installType) {
    const unzip = require('node-unzip-2');
    const fs = require('fs');
    const path = require('path');

    return new Promise((resolve, reject) => {
      // 验证 zip 文件是否存在
      if (!fs.existsSync(target_path)) {
        const error = new Error(ctx.__('template.error.zipNotFound', [target_path]));
        ctx.logger.error(error.message);
        return reject(error);
      }

      ctx.logger.info(`Starting extraction of: ${target_path}`);

      // 开始解压缩
      const extract = unzip.Extract({
        path: DOWNLOAD_DIR,
      });
      extract.on('error', function (err) {
        ctx.logger.error('Extraction error:', err);
        // 解压异常处理
        reject(err);
      });
      extract.on('finish', async () => {
        ctx.logger.info('解压完成!!');

        // 解压成功后删除 zip 文件
        try {
          if (fs.existsSync(target_path)) {
            fs.unlinkSync(target_path);
            ctx.logger.info(`Cleaned up zip file: ${target_path}`);
          }
        } catch (cleanupError) {
          ctx.logger.warn(`Failed to cleanup zip file: ${cleanupError.message}`);
        }

        try {
          if (installType === 'create') {
            // 🎯 统一使用TemplateManager的安装方法
            const themePackage = {
              name: tempObj.name,
              slug: tempObj.alias,
              version: Array.isArray(tempObj.version) ? tempObj.version.join('.') : tempObj.version,
              author: tempObj.author,
              description: tempObj.comment,
              config: tempObj.config || {},
            };

            const installResult = await ctx.service.templateManager.installFromRemote(themePackage, DOWNLOAD_DIR, {
              marketId: tempObj.id,
              screenshot: tempObj.sImg,
            });

            ctx.logger.info(`Remote theme installation completed: ${installResult.theme.slug}`);
          } else if (installType === 'update') {
            if (ctx.query.localTempId) {
              const updateData = {
                version: Array.isArray(tempObj.version) ? tempObj.version.join('.') : tempObj.version,
                screenshot: tempObj.sImg,
                author: tempObj.author,
                description: tempObj.comment,
                config: tempObj.config || {},
                updateBy: ctx.session.adminUserInfo?.id || 'system',
              };
              const updatedTheme = await ctx.service.template.update(ctx.query.localTempId, updateData);

              // 模板更新后的自动生成处理
              try {
                const themePath = DOWNLOAD_DIR;
                // 更新时使用较为保守的生成策略
                const updateGenOptions = {
                  enabled: true,
                  generateLayouts: true,
                  generateTemplates: false, // 更新时不生成模板变体，避免覆盖用户自定义
                  generateComponents: false,
                  overwrite: false, // 不覆盖现有文件
                  verbose: false,
                };

                // 检查并生成缺失的文件
                const genResult = await ctx.service.templateManager.checkAndGenerateMissingTemplates(
                  ctx.query.localTempId,
                  updateGenOptions
                );

                if (genResult.generated > 0) {
                  ctx.logger.info(
                    `Auto-generation on update: generated ${genResult.generated} missing files for theme: ${updatedTheme.slug}`
                  );
                }
              } catch (genError) {
                ctx.logger.warn(`Auto-generation failed on update for theme: ${updatedTheme.slug}`, genError);
              }
            }
          }

          resolve(tempObj.alias);
        } catch (error) {
          ctx.logger.error('Template installation/update failed:', error);

          // 安装失败时清理所有文件（包括zip和解压的内容）
          try {
            // 删除 zip 文件
            if (fs.existsSync(target_path)) {
              fs.unlinkSync(target_path);
              ctx.logger.info(`Cleaned up failed zip file: ${target_path}`);
            }

            // 删除解压目录
            if (fs.existsSync(DOWNLOAD_DIR)) {
              fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
              ctx.logger.info(`Cleaned up failed installation directory: ${DOWNLOAD_DIR}`);
            }
          } catch (cleanupError) {
            ctx.logger.warn(`Failed to cleanup after error: ${cleanupError.message}`);
          }

          reject(error);
        }
      });

      // 开始解压
      try {
        fs.createReadStream(target_path).pipe(extract);
      } catch (pipeError) {
        ctx.logger.error('Failed to start extraction:', pipeError);
        reject(pipeError);
      }
    });
  },

  /**
   * 卸载主题
   * @param ctx
   */
  async uninstall(ctx) {
    const { id } = ctx.params;
    const { removeFiles = true } = ctx.request.body;

    try {
      // 检查模板是否为系统模板
      const template = await ctx.service.template.findById(id);
      if (!template) {
        return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.notFound') });
      }

      if (template.isSystemTemplate) {
        return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.deleteSystemForbidden') });
      }

      const result = await ctx.service.templateManager.uninstallTheme(id, removeFiles);

      ctx.helper.renderSuccess(ctx, { message: result.message });
    } catch (error) {
      ctx.helper.renderFail(ctx, { message: error.message });
    }
  },

  /**
   * 导出主题
   * @param ctx
   */
  async export(ctx) {
    const { id } = ctx.params;

    try {
      const result = await ctx.service.templateManager.exportTheme(id);

      // 设置下载响应头
      ctx.set('Content-Type', 'application/zip');
      ctx.set('Content-Disposition', `attachment; filename="${result.fileName}"`);
      ctx.set('Content-Length', result.size.toString());

      ctx.body = result.buffer;
    } catch (error) {
      ctx.helper.renderFail(ctx, { message: error.message });
    }
  },

  /**
   * 检查主题完整性
   * @param ctx
   */
  async checkIntegrity(ctx) {
    const { id } = ctx.params;

    try {
      const result = await ctx.service.templateManager.checkThemeIntegrity(id);

      ctx.helper.renderSuccess(ctx, { data: result });
    } catch (error) {
      ctx.helper.renderFail(ctx, { message: error.message });
    }
  },

  /**
   * 获取主题模板文件列表
   * @param ctx
   */
  async getTemplates(ctx) {
    const { id } = ctx.params;

    const template = await ctx.service.template.findById(id);
    if (!template) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.notFound') });
    }

    const templates = await ctx.service.template.getThemeTemplates(template.slug);

    ctx.helper.renderSuccess(ctx, { data: templates });
  },

  /**
   * 更新主题统计信息
   * @param ctx
   */
  async updateStats(ctx) {
    ctx.validate(rules.updateStats);

    const { id } = ctx.params;
    const { downloadCount, rating, reviewCount } = ctx.request.body;

    const statsUpdate = {};
    if (downloadCount !== undefined) statsUpdate.downloadCount = downloadCount;
    if (rating !== undefined) statsUpdate.rating = rating;
    if (reviewCount !== undefined) statsUpdate.reviewCount = reviewCount;

    const template = await ctx.service.template.updateStats(id, statsUpdate);

    ctx.helper.renderSuccess(ctx, { data: template });
  },

  /**
   * 批量更新主题状态
   * @param ctx
   */
  async batchUpdateStatus(ctx) {
    ctx.validate(rules.batchUpdateStatus);

    const { ids, status } = ctx.request.body;

    const result = await ctx.service.template.batchUpdateStatus(ids, status);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: `成功更新 ${result.modifiedCount} 个主题状态`,
    });
  },

  /**
   * 获取主题统计信息
   * @param ctx
   */
  async getStats(ctx) {
    const { query } = ctx.request;

    // 构建过滤条件
    const filters = {};
    if (query.status) {
      filters.status = { $eq: query.status };
    }

    const stats = await ctx.service.template.getTemplateStats(filters);

    ctx.helper.renderSuccess(ctx, { data: stats });
  },

  /**
   * 获取模板商店列表
   * @param ctx
   */
  async getTempsFromShop(ctx) {
    const payload = ctx.query;

    try {
      const pluginList = await ctx.helper.reqJsonData(this.app.config.doracms_api + '/api/cmsTemplate/getList', {
        ...payload,
        version: '3.0.0',
      });

      // 查询本地已安装的模板，判断是否已安装
      if (pluginList.docs && pluginList.docs.length > 0) {
        // 提取所有模板商店的ID
        const marketIds = pluginList.docs.map(item => item._id);

        // 通过 service 查询本地已安装的模板（通过 marketId 匹配）
        const installedMarketIds = await ctx.service.template.getInstalledMarketIds(marketIds);

        // 创建已安装模板ID的 Set 便于快速查找
        const installedMarketIdsSet = new Set(installedMarketIds);

        // 为每个模板添加 installed 字段
        pluginList.docs.forEach(template => {
          template.installed = installedMarketIdsSet.has(template._id);
        });
      }

      ctx.helper.renderSuccess(ctx, {
        data: pluginList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err.message || err,
      });
    }
  },

  /**
   * 模板升级
   * @param ctx
   */
  async updateTemplate(ctx) {
    const tempId = ctx.query.localTempId;
    const singleUserToken = ctx.query.singleUserToken;
    const { templateConfig: siteFunc } = require('../../utils');
    const url = require('url');
    const _ = require('lodash');

    try {
      let errMsg = '';
      if (!ctx.validateId(tempId)) {
        errMsg = ctx.__('validation.errorParams');
      }
      if (errMsg) {
        throw new Error(errMsg);
      }

      const targetTemp = await ctx.service.template.findById(tempId);
      if (!_.isEmpty(targetTemp)) {
        const remoteTemplateInfo = await ctx.helper.reqJsonData(
          this.app.config.doracms_api + '/api/cmsTemplate/getOne',
          {
            alias: targetTemp.slug,
            singleUserToken,
            authUser: '1',
          }
        );

        if (_.isEmpty(remoteTemplateInfo)) {
          throw new Error(ctx.__('validation.errorParams'));
        } else {
          ctx.query.tempId = remoteTemplateInfo.id;
          ctx.query.installType = 'update';
        }

        // 删除模板文件夹
        siteFunc.deleteThemeStaticForder(this.app, targetTemp.slug);

        const file_url = remoteTemplateInfo.filePath;
        const { downloadDirWithSep: DOWNLOAD_DIR } = TemplateController._resolveSafeThemeTempDir.call(
          this,
          remoteTemplateInfo.alias
        );
        const target_path = DOWNLOAD_DIR + url.parse(file_url).pathname.split('/').pop();

        // 清理旧的目录（如果存在）- 必须在下载之前
        if (fs.existsSync(DOWNLOAD_DIR)) {
          try {
            ctx.logger.info(`Cleaning existing directory before download: ${DOWNLOAD_DIR}`);
            fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
            ctx.logger.info(`Successfully cleaned directory: ${DOWNLOAD_DIR}`);
          } catch (cleanError) {
            ctx.logger.error(`Failed to clean directory: ${DOWNLOAD_DIR}`, cleanError);
            throw new Error(`清理旧目录失败: ${cleanError.message}`);
          }
        }

        // 文件下载
        await siteFunc.downloadTempFile(ctx, remoteTemplateInfo.filePath, DOWNLOAD_DIR);

        // 文件解压
        const tempAlias = await TemplateController._extractAndProcessTemplate(
          ctx,
          DOWNLOAD_DIR,
          target_path,
          remoteTemplateInfo,
          'update'
        );

        // 资源拷贝
        // await siteFunc.copyThemeToStaticForder(ctx, this.app, tempAlias, DOWNLOAD_DIR);

        ctx.helper.renderSuccess(ctx, {
          data: '',
          message: ctx.__('template.message.upgradeSuccess'),
        });
      } else {
        throw new Error(ctx.__('validation.errorParams'));
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err.message || err,
      });
    }
  },

  /**
   * 预览主题
   * @param ctx
   */
  async preview(ctx) {
    const { id } = ctx.params;

    const template = await ctx.service.template.findById(id);
    if (!template) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.notFound') });
    }

    // 检查主题文件是否存在
    const fileCheck = await ctx.service.template.checkThemeFiles(template.slug);
    if (!fileCheck.isValid) {
      return ctx.helper.renderFail(ctx, {
        message: ctx.__('template.error.themeFileIncomplete', [fileCheck.missingFiles.join(', ')]),
      });
    }

    ctx.helper.renderSuccess(ctx, {
      data: {
        theme: template,
        previewUrl: `/preview/${template.slug}`,
      },
    });
  },

  /**
   * 自动生成主题模板布局变体
   * @param ctx
   */
  async generateLayouts(ctx) {
    const { id } = ctx.params;
    const options = ctx.request.body || {};

    try {
      const result = await ctx.service.templateManager.generateThemeLayouts(id, options);

      ctx.helper.renderSuccess(ctx, {
        data: result,
        message: result.message,
      });
    } catch (error) {
      ctx.helper.renderFail(ctx, { message: error.message });
    }
  },

  /**
   * 批量生成主题模板
   * @param ctx
   */
  async batchGenerate(ctx) {
    const { id } = ctx.params;
    const options = ctx.request.body || {};

    try {
      const result = await ctx.service.templateManager.batchGenerateTemplates(id, options);

      ctx.helper.renderSuccess(ctx, {
        data: result,
        message: result.message,
      });
    } catch (error) {
      ctx.helper.renderFail(ctx, { message: error.message });
    }
  },

  /**
   * 检查并生成缺失的模板文件
   * @param ctx
   */
  async checkMissingTemplates(ctx) {
    const { id } = ctx.params;
    const options = ctx.request.body || {};

    try {
      const result = await ctx.service.templateManager.checkAndGenerateMissingTemplates(id, options);

      ctx.helper.renderSuccess(ctx, {
        data: result,
        message: result.message,
      });
    } catch (error) {
      ctx.helper.renderFail(ctx, { message: error.message });
    }
  },

  /**
   * 获取主题生成选项和状态
   * @param ctx
   */
  async getGenerationStatus(ctx) {
    const { id } = ctx.params;

    try {
      const template = await ctx.service.template.findById(id);
      if (!template) {
        return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.notFound') });
      }

      // 分析主题完整性
      const themePath = require('path').join(this.app.baseDir, 'app', 'view', template.slug);
      const missingFiles = await ctx.service.templateManager._analyzeThemeCompleteness(themePath, template.config);

      // 获取自动生成配置
      const autoGenConfig = ctx.service.templateManager._getAutoGenerationConfig();

      // 获取可用的内容类型和布局
      const contentTypes = ctx.service.templateManager._getDefaultContentTypes();
      const layouts = ctx.service.templateManager._getRequiredLayouts(template.config);

      ctx.helper.renderSuccess(ctx, {
        data: {
          theme: template,
          missing: missingFiles,
          autoGenConfig,
          availableOptions: {
            contentTypes,
            layouts,
          },
          stats: {
            totalMissing: missingFiles.length,
            requiredMissing: missingFiles.filter(f => f.required).length,
            optionalMissing: missingFiles.filter(f => !f.required).length,
          },
        },
      });
    } catch (error) {
      ctx.helper.renderFail(ctx, { message: error.message });
    }
  },

  /**
   * 检查模板文件结构是否完整
   * @param {String} downloadDir 解压目录
   * @param {String} folderName 文件夹名称
   * @return {Promise<Object>} 检查结果
   * @private
   */
  async _checkTemplateStructure(downloadDir, folderName) {
    const fs = require('fs');
    const path = require('path');

    return new Promise(resolve => {
      const system_template_forder = this.app.config.temp_view_forder;
      const tempForder = system_template_forder + folderName;

      // 检查必需的文件和目录
      const requiredPaths = [
        // 配置文件
        { path: tempForder + '/theme.json', name: 'theme.json', required: true },

        // 核心目录结构
        { path: tempForder + '/layouts', name: 'layouts目录', required: true },
        { path: tempForder + '/templates', name: 'templates目录', required: true },
        { path: tempForder + '/assets', name: 'assets目录', required: true },

        // 必需的布局文件
        { path: tempForder + '/layouts/default.html', name: 'default.html布局', required: true },

        // 必需的模板文件
        { path: tempForder + '/templates/index.html', name: 'index.html模板', required: true },
      ];

      let checkTempCount = 0;
      const maxRetries = 10;

      const tempTask = setInterval(async () => {
        // 检查所有必需的文件和目录
        const missingRequired = requiredPaths.filter(item => item.required && !fs.existsSync(item.path));

        if (missingRequired.length === 0) {
          clearInterval(tempTask);
          resolve({
            success: true,
            message: '模板文件结构完整',
            configFile: 'theme.json',
          });
        } else {
          checkTempCount++;

          if (checkTempCount > maxRetries) {
            clearInterval(tempTask);

            const errors = missingRequired.map(item => `缺少${item.name}`);

            // 清理不完整的文件
            try {
              if (this.ctx && this.ctx.helper) {
                await this.ctx.helper.deleteFolder(tempForder);
                await this.ctx.helper.deleteFolder(tempForder + '.zip');
              }
            } catch (cleanupError) {
              console.warn('清理文件失败:', cleanupError);
            }

            resolve({
              success: false,
              message: '模板文件结构不完整',
              errors,
            });
          }
        }
      }, 3000);
    });
  },

  /**
   * 标准化模板配置格式
   * @param {Object} config theme.json配置对象
   * @return {Object} 标准化后的配置
   * @private
   */
  _normalizeTemplateConfig(config) {
    // 标准化theme.json格式
    const normalizedConfig = {
      name: config.theme?.displayName || config.name,
      alias: config.theme?.name || config.name,
      version: config.theme?.version || config.version || '1.0.0',
      author: config.author || 'Unknown',
      comment: config.theme?.description || config.description || '',
      config: {
        layouts: config.layouts || {},
        templates: config.templates || {},
        components: config.components || {},
        partials: config.partials || {},
        assets: config.assets || {},
        settings: config.settings || {},
        colors: config.colors || {},
        fonts: config.fonts || {},
        breakpoints: config.breakpoints || {},
      },
    };

    // 验证必需字段
    if (!normalizedConfig.name) {
      throw new Error(ctx.__('template.error.configNameRequired'));
    }
    if (!normalizedConfig.alias) {
      throw new Error(ctx.__('template.error.configAliasRequired'));
    }

    return normalizedConfig;
  },
};

module.exports = TemplateController;
