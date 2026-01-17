/**
 * Database Initialization Script
 * 数据库初始化脚本 - 支持 MongoDB 和 MariaDB
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const path = require('path');
const fs = require('fs');

/**
 * 确保 MariaDB 表已创建
 * 使用 Sequelize sync 创建表（如果不存在）
 *
 * @param {Application} app EggJS app 实例
 */
async function ensureMariaDBTablesExist(app) {
  try {
    app.logger.debug('[egg-ai-assistant] Checking MariaDB tables...');

    // 动态加载 ConnectionLoader（注意：从 migrations/scripts/ 需要返回两级目录）
    const ConnectionLoader = require('../../app/repository/base/ConnectionLoader');

    // 获取 MariaDB Connection 单例实例（注意：要用 getInstance，不是类本身）
    const connection = ConnectionLoader.getMariaDBConnectionInstance(app);

    if (!connection || !connection.models) {
      app.logger.warn('[egg-ai-assistant] MariaDB connection or models not found, skipping table creation');
      app.logger.debug('[egg-ai-assistant] Connection:', !!connection);
      app.logger.debug(
        '[egg-ai-assistant] Connection.models:',
        connection?.models ? `Map with ${connection.models.size} entries` : 'undefined'
      );
      return;
    }

    // 从 connection.models 获取插件的 Model（这些在 app.js 中已注册）
    // 注意：connection.models 是 Map 对象，要用 get() 方法
    const modelsToSync = [
      { name: 'AIModel', model: connection.models.get('AIModel') },
      { name: 'PromptTemplate', model: connection.models.get('PromptTemplate') },
      { name: 'AIUsageLog', model: connection.models.get('AIUsageLog') },
    ];

    let tablesCreated = 0;
    const tablesExisted = 0;

    for (const { name, model } of modelsToSync) {
      if (!model) {
        app.logger.warn(`[egg-ai-assistant] Model ${name} not found, skipping...`);
        continue;
      }

      try {
        // sync({ alter: false }) 只会创建不存在的表，不会修改已存在的表
        const result = await model.sync({ alter: false });

        // 检查表是否是新建的
        const tableName = model.getTableName();
        app.logger.debug(`[egg-ai-assistant] ✓ Table '${tableName}' is ready`);
        tablesCreated++;
      } catch (error) {
        app.logger.error(`[egg-ai-assistant] ✗ Failed to sync table for ${name}:`, error.message);
        // 继续处理其他表
      }
    }

    app.logger.debug(`[egg-ai-assistant] MariaDB tables check completed (${tablesCreated} tables ready)`);
  } catch (error) {
    app.logger.error('[egg-ai-assistant] Failed to ensure MariaDB tables exist:', error);
    throw error;
  }
}

/**
 * 初始化 AI 助手数据库
 * 自动检测数据库类型并执行相应的初始化操作
 *
 * @param {Application} app EggJS app 实例
 */
module.exports = async app => {
  const dbType = app.config.repository?.databaseType || 'mongodb';

  app.logger.debug(`[egg-ai-assistant] Database initialization started (${dbType})`);

  try {
    // 1. 如果是 MariaDB，先确保表已创建
    if (dbType === 'mariadb') {
      await ensureMariaDBTablesExist(app);
    }

    // 2. 创建匿名上下文用于 Repository 操作
    const ctx = app.createAnonymousContext();

    // 3. 获取 Repository
    const aiModelRepo = app.repositoryFactory.createRepository('AIModel', ctx);
    const promptRepo = app.repositoryFactory.createRepository('PromptTemplate', ctx);

    // 4. 检查是否已初始化（通过检查是否已有模型数据）
    const existingModelsCount = await aiModelRepo.count({});
    if (existingModelsCount > 0) {
      app.logger.debug('[egg-ai-assistant] Database already initialized (found existing models), skipping...');
      return {
        alreadyInitialized: true,
        existingModelsCount,
      };
    }

    app.logger.debug('[egg-ai-assistant] No existing data found, proceeding with initialization...');

    // 加载 Seed 数据
    const defaultModels = loadSeedData('default-models.json');
    const defaultPrompts = loadSeedData('default-prompts.json');

    if (!defaultModels || !defaultPrompts) {
      throw new Error('Failed to load seed data files');
    }

    // 初始化 AI 模型
    app.logger.info(`[egg-ai-assistant] Seeding ${defaultModels.length} AI models...`);
    const createdModels = [];
    for (const modelData of defaultModels) {
      try {
        const existingModel = await aiModelRepo.findOne({
          provider: modelData.provider,
          modelName: modelData.modelName,
        });

        if (existingModel) {
          app.logger.info(`[egg-ai-assistant] - Skipped model (already exists): ${modelData.displayName}`);
          continue;
        }

        const model = await aiModelRepo.create(modelData);
        createdModels.push(model);
        app.logger.info(`[egg-ai-assistant] ✓ Created model: ${modelData.displayName}`);
      } catch (error) {
        app.logger.error(`[egg-ai-assistant] ✗ Failed to create model ${modelData.displayName}:`, error.message);
        // 继续处理其他模型
      }
    }

    // 初始化提示词模板
    app.logger.info(`[egg-ai-assistant] Seeding ${defaultPrompts.length} prompt templates...`);
    const createdPrompts = [];
    for (const promptData of defaultPrompts) {
      try {
        const existingPrompt = await promptRepo.findOne({
          taskType: promptData.taskType,
          language: promptData.language,
          version: promptData.version,
        });

        if (existingPrompt) {
          app.logger.info(`[egg-ai-assistant] - Skipped prompt (already exists): ${promptData.name}`);
          continue;
        }

        const prompt = await promptRepo.create(promptData);
        createdPrompts.push(prompt);
        app.logger.info(`[egg-ai-assistant] ✓ Created prompt: ${promptData.name}`);
      } catch (error) {
        app.logger.error(`[egg-ai-assistant] ✗ Failed to create prompt ${promptData.name}:`, error.message);
        // 继续处理其他提示词
      }
    }

    app.logger.debug('[egg-ai-assistant] ========================================');
    app.logger.debug('[egg-ai-assistant] Database initialization completed successfully!');
    app.logger.debug('[egg-ai-assistant] ----------------------------------------');
    app.logger.info(`[egg-ai-assistant] AI Models: ${createdModels.length}/${defaultModels.length} created`);
    app.logger.info(`[egg-ai-assistant] Prompt Templates: ${createdPrompts.length}/${defaultPrompts.length} created`);
    app.logger.debug('[egg-ai-assistant] ========================================');

    return {
      success: true,
      modelsCreated: createdModels.length,
      promptsCreated: createdPrompts.length,
    };
  } catch (error) {
    app.logger.error('[egg-ai-assistant] Database initialization failed:', error);
    throw error;
  }
};

/**
 * 加载 Seed 数据文件
 * @param {String} filename 文件名
 * @return {Array|null}
 */
function loadSeedData(filename) {
  try {
    const filePath = path.join(__dirname, '../seed', filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`[egg-ai-assistant] Seed data file not found: ${filePath}`);
      return null;
    }

    // 读取并解析 JSON 文件
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    if (!Array.isArray(data)) {
      console.error(`[egg-ai-assistant] Seed data must be an array: ${filename}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`[egg-ai-assistant] Failed to load seed data ${filename}:`, error);
    return null;
  }
}

/**
 * 验证 Seed 数据完整性
 * @param {Array} models 模型数据
 * @param {Array} prompts 提示词数据
 * @return {Object} 验证结果
 */
function validateSeedData(models, prompts) {
  const errors = [];

  // 验证模型数据
  models.forEach((model, index) => {
    if (!model.provider) {
      errors.push(`Model ${index}: missing 'provider' field`);
    }
    if (!model.modelName) {
      errors.push(`Model ${index}: missing 'modelName' field`);
    }
    if (!model.displayName) {
      errors.push(`Model ${index}: missing 'displayName' field`);
    }
  });

  // 验证提示词数据
  prompts.forEach((prompt, index) => {
    if (!prompt.name) {
      errors.push(`Prompt ${index}: missing 'name' field`);
    }
    if (!prompt.taskType) {
      errors.push(`Prompt ${index}: missing 'taskType' field`);
    }
    if (!prompt.language) {
      errors.push(`Prompt ${index}: missing 'language' field`);
    }
    if (!prompt.template) {
      errors.push(`Prompt ${index}: missing 'template' field`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 清空数据库（仅用于测试）
 * ⚠️ 危险操作，生产环境不要使用
 *
 * @param {Application} app EggJS app 实例
 */
module.exports.cleanup = async app => {
  app.logger.warn('[egg-ai-assistant] ⚠️  Database cleanup started - THIS WILL DELETE ALL DATA!');

  try {
    const ctx = app.createAnonymousContext();

    const aiModelRepo = app.repositoryFactory.createRepository('AIModel', ctx);
    const promptRepo = app.repositoryFactory.createRepository('PromptTemplate', ctx);
    const usageLogRepo = app.repositoryFactory.createRepository('AIUsageLog', ctx);

    // 删除所有数据
    const modelsDeleted = await aiModelRepo.removeAll();
    const promptsDeleted = await promptRepo.removeAll();
    const logsDeleted = await usageLogRepo.removeAll();

    app.logger.warn('[egg-ai-assistant] ========================================');
    app.logger.warn('[egg-ai-assistant] Database cleanup completed!');
    app.logger.warn('[egg-ai-assistant] ----------------------------------------');
    app.logger.warn(`[egg-ai-assistant] AI Models deleted: ${modelsDeleted}`);
    app.logger.warn(`[egg-ai-assistant] Prompt Templates deleted: ${promptsDeleted}`);
    app.logger.warn(`[egg-ai-assistant] Usage Logs deleted: ${logsDeleted}`);
    app.logger.warn('[egg-ai-assistant] ========================================');

    return {
      success: true,
      modelsDeleted,
      promptsDeleted,
      logsDeleted,
    };
  } catch (error) {
    app.logger.error('[egg-ai-assistant] Database cleanup failed:', error);
    throw error;
  }
};

/**
 * 重新初始化数据库
 * 先清空再初始化（仅用于测试）
 *
 * @param {Application} app EggJS app 实例
 */
module.exports.reinitialize = async app => {
  app.logger.debug('[egg-ai-assistant] Database reinitialization started...');

  try {
    // 先清空
    await module.exports.cleanup(app);

    // 再初始化
    await module.exports(app);

    app.logger.debug('[egg-ai-assistant] Database reinitialization completed successfully!');

    return { success: true };
  } catch (error) {
    app.logger.error('[egg-ai-assistant] Database reinitialization failed:', error);
    throw error;
  }
};

/**
 * 检查数据库状态
 * @param {Application} app EggJS app 实例
 */
module.exports.checkStatus = async app => {
  try {
    const ctx = app.createAnonymousContext();

    const aiModelRepo = app.repositoryFactory.createRepository('AIModel', ctx);
    const promptRepo = app.repositoryFactory.createRepository('PromptTemplate', ctx);
    const usageLogRepo = app.repositoryFactory.createRepository('AIUsageLog', ctx);

    const modelsCount = await aiModelRepo.count({});
    const promptsCount = await promptRepo.count({});
    const logsCount = await usageLogRepo.count({});

    app.logger.debug('[egg-ai-assistant] ========================================');
    app.logger.debug('[egg-ai-assistant] Database Status:');
    app.logger.debug('[egg-ai-assistant] ----------------------------------------');
    app.logger.info(`[egg-ai-assistant] AI Models: ${modelsCount}`);
    app.logger.info(`[egg-ai-assistant] Prompt Templates: ${promptsCount}`);
    app.logger.info(`[egg-ai-assistant] Usage Logs: ${logsCount}`);
    app.logger.info(`[egg-ai-assistant] Database Type: ${app.config.repository?.databaseType || 'mongodb'}`);
    app.logger.debug('[egg-ai-assistant] ========================================');

    return {
      modelsCount,
      promptsCount,
      logsCount,
      dbType: app.config.repository?.databaseType || 'mongodb',
    };
  } catch (error) {
    app.logger.error('[egg-ai-assistant] Failed to check database status:', error);
    throw error;
  }
};
