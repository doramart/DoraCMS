/*
 * @Author: doramart
 * @Date: 2019-06-20 18:55:40
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-XX-XX XX:XX:XX
 * @Description: Plugin Controller - 基于Repository模式重构，遵循标准化参数格式
 */

'use strict';
const Controller = require('egg').Controller;
const shell = require('shelljs');
const { spawnSync } = require('child_process');
const workPath = process.cwd();
const pkg = require(`${workPath}/package.json`);
const _ = require('lodash');
const env = process.env.NODE_ENV;
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const NPM_PACKAGE_NAME_RE = /^(?:@[\w.-]+\/)?[\w.-]+$/;

function assertSafePackageName(pkgName) {
  if (!pkgName || typeof pkgName !== 'string' || !NPM_PACKAGE_NAME_RE.test(pkgName)) {
    throw new Error(`Invalid package name: ${pkgName}`);
  }
}

function runNpm(args) {
  const result = spawnSync('npm', args, {
    cwd: workPath,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  return {
    code: result.status ?? (result.error ? 1 : 0),
    stdout: result.stdout || '',
    stderr: result.stderr || result.error?.message || '',
  };
}

class PluginController extends Controller {
  /**
   * 获取插件列表
   * 🔥 重构要点：标准化查询条件，使用filters和操作符格式
   */
  async list() {
    const { ctx } = this;
    const payload = ctx.query;
    const helpType = ctx.query.helpType;
    const name = ctx.query.name;
    const description = ctx.query.description;

    // ✅ 标准化查询条件构建 - 使用操作符格式
    const filters = {};

    // 🔥 基础过滤条件：排除内置插件
    filters.type = { $ne: '1' };

    // 🔥 动态构建filters对象
    if (helpType) {
      filters.type = { $eq: helpType }; // 覆盖基础条件
    }

    if (name) {
      filters.name = { $regex: name, $options: 'i' };
    }

    if (description) {
      filters.description = { $regex: description, $options: 'i' };
    }

    // ✅ 标准化查询选项
    const options = {
      filters,
      fields: ['alias', 'enName', 'name', 'description', 'version', 'state', 'type', 'pluginId', 'installor'],
      searchKeys: ['alias', 'enName', 'name'],
      populate: [
        {
          path: 'installor',
          select: ['userName', 'nickName', 'id'],
        },
      ],
    };

    // 调用Repository方法 - 异常会自动抛出
    const pluginList = await ctx.service.plugin.find(payload, options);

    // 🔥 业务逻辑：检查插件更新状态
    let currentPluginList = [];
    if (!_.isEmpty(pluginList) && !_.isEmpty(pluginList.docs)) {
      const renderPluginList = JSON.parse(JSON.stringify(pluginList.docs));
      for (const pluginItem of renderPluginList) {
        // 获取插件商店信息
        const pluginShopItem = await this.ctx.helper.reqJsonData(
          this.app.config.doracms_api + '/api/pluginManage/getOne?id=' + pluginItem.pluginId
        );

        if (!_.isEmpty(pluginShopItem)) {
          // 版本比较逻辑
          const currentVersionNum = this._parseVersion(pluginItem.version);
          const targetVersionNum = this._parseVersion(pluginShopItem.version);

          if (currentVersionNum < targetVersionNum) {
            pluginItem.shouldUpdate = true;
            pluginItem.targetVersion = pluginShopItem.version;
          } else {
            pluginItem.shouldUpdate = false;
          }
        } else {
          // 🔥 使用语义化异常替代通用Error
          throw RepositoryExceptions.plugin.pluginNotFound(pluginItem.pluginId);
        }
      }
      currentPluginList = _.assign({}, pluginList, {
        docs: renderPluginList,
      });
    } else {
      currentPluginList = pluginList;
    }

    ctx.helper.renderSuccess(ctx, {
      data: currentPluginList,
    });
  }

  /**
   * 安装插件
   * 🔥 重构要点：业务验证逻辑优化，使用Repository统一异常处理
   */
  async installPlugin() {
    const { ctx } = this;
    const pluginId = ctx.query.pluginId;

    // 🔥 参数验证 - 使用语义化异常
    if (!pluginId) {
      throw RepositoryExceptions.plugin.pluginIdRequired();
    }

    // 🔥 业务验证：检查插件是否已安装 - 自动抛出异常
    const isInstalled = await ctx.service.plugin.checkPluginInstalled(pluginId);
    if (isInstalled) {
      throw RepositoryExceptions.plugin.alreadyInstalled(pluginId);
    }

    // 1、获取插件信息
    const pluginInfos = await this.ctx.helper.reqJsonData(
      this.app.config.doracms_api + '/api/pluginManage/getOne?id=' + pluginId
    );

    if (_.isEmpty(pluginInfos)) {
      throw RepositoryExceptions.plugin.pluginNotFound(pluginId);
    }

    // 2、执行安装流程
    try {
      assertSafePackageName(pluginInfos.pkgName);

      // NPM 包安装
      const installResult = runNpm([ 'install', pluginInfos.pkgName, '--save', '--registry=https://registry.npm.taobao.org' ]);

      if (installResult.code !== 0) {
        throw RepositoryExceptions.plugin.packageInstallError(pluginInfos.pkgName, installResult.stderr);
      }

      // 3、初始化数据表
      if (pluginInfos.initData) {
        try {
          await this.app.initExtendData(ctx, pluginInfos);
        } catch (error) {
          throw RepositoryExceptions.plugin.initDataFailed(pluginId, error.message);
        }
      }

      // 4、插入resource数据
      try {
        await this.app.initResourceData(ctx, pluginInfos);
      } catch (error) {
        throw RepositoryExceptions.plugin.resourceInitFailed(pluginId, error.message);
      }

      // 5、插入配置文件
      try {
        await this.app.initPluginConfig(pluginInfos);
      } catch (error) {
        throw RepositoryExceptions.plugin.configFileError('plugin config', error.message);
      }

      // 6、保存插件基本信息到本地
      const currentPluginInfo = _.assign({}, pluginInfos, {
        pluginId: pluginInfos.id,
        installor: ctx.session.adminUserInfo.id,
        createdAt: new Date(),
      });
      delete currentPluginInfo.id;

      await ctx.service.plugin.create(currentPluginInfo);

      ctx.helper.renderSuccess(ctx);

      // 7、重启服务（生产环境）
      if (env === 'production') {
        setTimeout(() => {
          shell.exec(`pm2 restart ${pkg.name}`);
        }, 1000);
      }
    } catch (error) {
      // 如果是业务异常，直接抛出；否则包装为安装失败异常
      if (error.name && error.name.includes('Error')) {
        throw error;
      }
      throw RepositoryExceptions.plugin.installFailed(pluginId, error.message);
    }
  }

  /**
   * 卸载插件
   * 🔥 重构要点：标准化查询和异常处理
   */
  async unInstallPlugin() {
    const { ctx } = this;
    const targetId = ctx.query.pluginId;

    // 🔥 参数验证
    if (!targetId) {
      throw RepositoryExceptions.plugin.pluginIdRequired();
    }

    // 🔥 标准化查询 - 使用findById方法
    const pluginInfos = await ctx.service.plugin.findById(targetId);
    if (!pluginInfos) {
      throw RepositoryExceptions.plugin.notFound(targetId);
    }

    // 🔥 业务规则验证：内置插件不能卸载
    if (pluginInfos.type === '1') {
      throw RepositoryExceptions.plugin.cannotUninstallBuiltin(targetId);
    }

    try {
      assertSafePackageName(pluginInfos.pkgName);

      // 1、npm uninstall 卸载
      const uninstallResult = runNpm([ 'uninstall', pluginInfos.pkgName ]);
      if (uninstallResult.code !== 0) {
        throw RepositoryExceptions.plugin.packageUninstallError(pluginInfos.pkgName, uninstallResult.stderr);
      }

      // 2、删除数据表
      if (pluginInfos.initData) {
        try {
          await this.app.initExtendData(ctx, pluginInfos, 'uninstall');
        } catch (error) {
          this.ctx.logger.warn(this.ctx.__('plugin.errors.deleteTableFailed', [error.message]));
        }
      }

      // 3、删除插入的resource数据
      try {
        await this.app.initResourceData(ctx, pluginInfos, 'uninstall');
      } catch (error) {
        this.ctx.logger.warn(this.ctx.__('plugin.errors.deleteResourceFailed', [error.message]));
      }

      // 4、删除配置文件
      try {
        await this.app.initPluginConfig(pluginInfos, 'uninstall');
      } catch (error) {
        this.ctx.logger.warn(this.ctx.__('plugin.errors.deleteConfigFailed', [error.message]));
      }

      // 5、删除插件基本信息
      await ctx.service.plugin.remove(targetId);

      ctx.helper.renderSuccess(ctx);

      // 6、重启服务（生产环境）
      if (env === 'production') {
        setTimeout(() => {
          shell.exec(`pm2 restart ${pkg.name}`);
        }, 1000);
      }
    } catch (error) {
      if (error.name && error.name.includes('Error')) {
        throw error;
      }
      throw RepositoryExceptions.plugin.uninstallFailed(targetId, error.message);
    }
  }

  /**
   * 更新插件
   * 🔥 重构要点：标准化查询和版本验证
   */
  async updatePlugin() {
    const { ctx } = this;
    const targetId = ctx.query.pluginId;

    if (!targetId) {
      throw RepositoryExceptions.plugin.pluginIdRequired();
    }

    // 🔥 标准化查询
    const pluginInfos = await ctx.service.plugin.findById(targetId);
    if (!pluginInfos) {
      throw RepositoryExceptions.plugin.notFound(targetId);
    }

    // 获取最新插件信息
    const pluginItem = await this.ctx.helper.reqJsonData(
      this.app.config.doracms_api + '/api/pluginManage/getOne?id=' + pluginInfos.pluginId
    );

    if (_.isEmpty(pluginItem)) {
      throw RepositoryExceptions.plugin.pluginNotFound(pluginInfos.pluginId);
    }

    // 🔥 版本检查
    const currentVersion = this._parseVersion(pluginInfos.version);
    const targetVersion = this._parseVersion(pluginItem.version);

    if (currentVersion >= targetVersion) {
      throw RepositoryExceptions.plugin.noUpdateAvailable(pluginInfos.pluginId);
    }

    try {
      // 更新数据库记录
      delete pluginItem.id;
      pluginItem.updatedAt = new Date();
      await ctx.service.plugin.update(targetId, pluginItem);

      // 更新NPM包
      assertSafePackageName(pluginItem.pkgName);
      const updateResult = runNpm([ 'install', pluginItem.pkgName, '--save', '--registry=https://registry.npm.taobao.org' ]);

      if (updateResult.code !== 0) {
        throw RepositoryExceptions.plugin.packageInstallError(pluginItem.pkgName, updateResult.stderr);
      }

      ctx.helper.renderSuccess(ctx);

      // 重启服务（生产环境）
      if (env === 'production') {
        setTimeout(() => {
          shell.exec(`pm2 restart ${pkg.name}`);
        }, 1000);
      }
    } catch (error) {
      if (error.name && error.name.includes('Error')) {
        throw error;
      }
      throw RepositoryExceptions.plugin.updateFailed(targetId, error.message);
    }
  }

  /**
   * 启用/禁用插件
   * 🔥 重构要点：标准化参数处理和状态验证
   */
  async enablePlugin() {
    const { ctx } = this;
    const fields = ctx.request.body;
    const targetId = fields.id;
    const state = fields.state;

    // 🔥 参数验证
    if (!targetId) {
      throw RepositoryExceptions.plugin.pluginIdRequired();
    }

    if (typeof state !== 'boolean') {
      throw RepositoryExceptions.validation('插件状态必须是布尔值');
    }

    // 🔥 检查插件是否存在
    const pluginInfos = await ctx.service.plugin.findById(targetId);
    if (!pluginInfos) {
      throw RepositoryExceptions.plugin.notFound(targetId);
    }

    // 🔥 状态检查
    if (pluginInfos.state === state) {
      if (state) {
        throw RepositoryExceptions.plugin.alreadyEnabled(targetId);
      } else {
        throw RepositoryExceptions.plugin.alreadyDisabled(targetId);
      }
    }

    // 更新状态
    await ctx.service.plugin.update(targetId, { state });

    ctx.helper.renderSuccess(ctx);
  }

  /**
   * 获取单个插件信息
   * 🔥 重构要点：标准化参数和方法调用
   */
  async getOne() {
    const { ctx } = this;
    const id = ctx.query.id;

    if (!id) {
      throw RepositoryExceptions.plugin.pluginIdRequired();
    }

    // 🔥 使用标准化查询方法，包含关联信息
    const targetItem = await ctx.service.plugin.findById(id, {
      populate: [
        {
          path: 'installor', // 保持API兼容性，内部会映射到installorInfo
          select: ['userName', 'nickName', 'id'],
        },
      ],
    });

    if (!targetItem) {
      throw RepositoryExceptions.plugin.notFound(id);
    }

    ctx.helper.renderSuccess(ctx, {
      data: targetItem,
    });
  }

  /**
   * 批量删除插件
   * 🔥 重构要点：参数验证和批量操作
   */
  async removes() {
    const { ctx } = this;

    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('plugin.fields.name'),
    });

    // 🔥 批量权限检查：不能删除内置插件
    for (const id of idsArray) {
      const plugin = await ctx.service.plugin.findById(id);
      if (plugin && plugin.type === '1') {
        throw RepositoryExceptions.plugin.cannotDeleteSystemPlugin(id);
      }
    }

    // 执行批量删除
    await ctx.service.plugin.remove(idsArray);
    ctx.helper.renderSuccess(ctx);
  }

  /**
   * 获取插件商店列表
   * 🔥 重构要点：标准化查询格式
   */
  async getPluginShopList() {
    const { ctx } = this;
    const payload = ctx.query;

    // 获取插件商店列表
    const pluginList = await this.ctx.helper.reqJsonData(
      this.app.config.doracms_api + '/api/pluginManage/getList',
      payload
    );

    if (!_.isEmpty(pluginList) && !_.isEmpty(pluginList.docs)) {
      const renderPluginList = JSON.parse(JSON.stringify(pluginList.docs));

      // 🔥 并行检查安装状态，提升性能
      const checkPromises = renderPluginList.map(async pluginItem => {
        const isInstalled = await ctx.service.plugin.checkPluginInstalled(pluginItem.id);
        pluginItem.installed = isInstalled;
        return pluginItem;
      });

      const checkedPlugins = await Promise.all(checkPromises);
      pluginList.docs = checkedPlugins;
    }

    ctx.helper.renderSuccess(ctx, {
      data: pluginList,
    });
  }

  /**
   * 获取插件商店单个插件信息
   */
  async getPluginShopItem() {
    const { ctx } = this;
    const targetId = ctx.query.id;

    if (!targetId) {
      throw RepositoryExceptions.plugin.pluginIdRequired();
    }

    const pluginItem = await this.ctx.helper.reqJsonData(
      this.app.config.doracms_api + '/api/pluginManage/getOne?id=' + targetId
    );

    if (_.isEmpty(pluginItem)) {
      throw RepositoryExceptions.plugin.pluginNotFound(targetId);
    }

    ctx.helper.renderSuccess(ctx, {
      data: pluginItem,
    });
  }

  /**
   * 创建支付订单
   */
  async createInvoice() {
    const { ctx } = this;
    const targetId = ctx.request.body.pluginId;

    if (!targetId) {
      throw RepositoryExceptions.plugin.pluginIdRequired();
    }

    const pluginItem = await this.ctx.helper.reqJsonData(
      this.app.config.doracms_api + '/api/pluginManage/getOne?id=' + targetId
    );

    if (_.isEmpty(pluginItem)) {
      throw RepositoryExceptions.plugin.pluginNotFound(targetId);
    }

    const invoiceData = {
      subject: pluginItem.name,
      amount: pluginItem.amount,
      body: pluginItem.description,
    };

    const askCreateInvoiceUrl = `${this.app.config.doracms_api}/api/alipaySystem/createInvoice`;
    const createInvoiceResult = await ctx.helper.reqJsonData(askCreateInvoiceUrl, invoiceData, 'post');

    ctx.helper.renderSuccess(ctx, {
      data: createInvoiceResult,
    });
  }

  /**
   * 检查支付状态
   */
  async checkInvoice() {
    const { ctx } = this;
    const noInvoice = ctx.request.body.noInvoice;

    if (!noInvoice) {
      throw RepositoryExceptions.validation('订单号不能为空');
    }

    const checkInviceState = await this.ctx.helper.reqJsonData(
      this.app.config.doracms_api + '/api/alipaySystem/checkInvoice',
      {
        noInvoice,
      },
      'post'
    );

    ctx.helper.renderSuccess(ctx, {
      data: checkInviceState,
    });
  }

  /**
   * 心跳监测
   */
  async pluginHeartBeat() {
    const { ctx } = this;
    ctx.helper.renderSuccess(ctx, {
      data: 'success',
    });
  }

  // ===== 🔥 辅助方法 =====

  /**
   * 解析版本号为数字，用于版本比较
   * @param {String} version 版本号字符串，如 "1.2.3"
   * @return {Number} 版本号数字
   * @private
   */
  _parseVersion(version) {
    if (!version) return 0;

    try {
      // 将版本号分解为数组，如 "1.2.3" -> [1, 2, 3]
      const parts = version.split('.').map(num => parseInt(num, 10) || 0);

      // 转换为数字：1.2.3 -> 1002003（假设每部分最多3位数）
      return parts[0] * 1000000 + (parts[1] || 0) * 1000 + (parts[2] || 0);
    } catch {
      return 0;
    }
  }
}

module.exports = PluginController;
