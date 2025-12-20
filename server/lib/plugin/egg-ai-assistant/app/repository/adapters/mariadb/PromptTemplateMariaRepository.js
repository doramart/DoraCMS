/**
 * Prompt Template MariaDB Repository
 * 继承 BaseMariaRepository，实现提示词模板的数据访问
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const BaseRepositoryLoader = require('../../base/BaseRepositoryLoader');

// 缓存动态创建的类
let PromptTemplateMariaRepositoryClass = null;

/**
 * 获取 PromptTemplateMariaRepository 类（延迟创建）
 * @param {Application} app Egg Application 实例
 * @return {Class} PromptTemplateMariaRepository 类
 */
function getPromptTemplateMariaRepository(app) {
  if (!PromptTemplateMariaRepositoryClass) {
    // 动态加载基类
    const BaseMariaRepository = BaseRepositoryLoader.getBaseMariaRepository(app);

    // 动态创建继承类
    PromptTemplateMariaRepositoryClass = class PromptTemplateMariaRepository extends BaseMariaRepository {
      constructor(ctx) {
        // 调用父类构造函数
        super(ctx, 'PromptTemplate');

        // 动态获取 MariaDB 连接管理器（支持 npm 发布）
        const ConnectionLoader = require('../../base/ConnectionLoader');
        this.connection = ConnectionLoader.getMariaDBConnectionInstance(ctx.app);
        this.model = null; // 将在 _initializeConnection 中设置
      }

      /**
       * 初始化数据库连接和模型
       * @private
       */
      async _initializeConnection() {
        try {
          // 确保连接管理器已初始化
          await this.connection.initialize();

          // 从连接管理器获取模型
          this.model = this.connection.getModel('PromptTemplate');

          if (!this.model) {
            throw new Error('PromptTemplate 模型未找到，请检查模型加载顺序');
          }

          // 注册模型和关联关系
          this.registerModel({
            mariaModel: this.model,
            relations: {
              parentTemplate: {
                model: this.connection.getModel('PromptTemplate'),
                type: 'belongsTo',
                foreignKey: 'parentTemplateId',
                as: 'parentTemplate',
                select: ['id', 'name', 'version', 'taskType'],
              },
            },
          });
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] Initialization failed:', error);
          throw error;
        }
      }

      /**
       * 确保连接已建立
       * @private
       */
      async _ensureConnection() {
        if (!this.model) {
          await this._initializeConnection();
        }
      }

      /**
       * 获取默认的关联查询配置
       */
      _getDefaultPopulate() {
        return [];
      }

      /**
       * 获取默认的搜索字段
       */
      _getDefaultSearchKeys() {
        return ['name', 'description', 'template'];
      }

      /**
       * 获取默认的排序配置
       */
      _getDefaultSort() {
        return [
          { field: 'priority', order: 'desc' },
          { field: 'createdAt', order: 'desc' },
        ];
      }

      /**
       * 根据任务类型和语言查找模板
       * @param {String} taskType 任务类型
       * @param {String} language 语言代码
       * @return {Promise<Object|null>}
       */
      async findByTaskTypeAndLanguage(taskType, language) {
        try {
          const result = await this.findOne(
            {},
            {
              filters: {
                taskType: { $eq: taskType },
                language: { $eq: language },
                isEnabled: { $eq: true },
              },
              sort: [
                { field: 'priority', order: 'desc' },
                { field: 'version', order: 'desc' },
              ],
            }
          );
          return result;
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] findByTaskTypeAndLanguage failed:', error);
          throw this.exceptions.RepositoryError('Failed to find prompt template', {
            taskType,
            language,
            error: error.message,
          });
        }
      }

      /**
       * 获取所有任务类型
       * @return {Promise<Array>}
       */
      async getTaskTypes() {
        try {
          const results = await this.model.findAll({
            attributes: [[this.ctx.app.Sequelize.fn('DISTINCT', this.ctx.app.Sequelize.col('taskType')), 'taskType']],
            raw: true,
          });
          return results.map(r => r.taskType);
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] getTaskTypes failed:', error);
          throw this.exceptions.RepositoryError('Failed to get task types', {
            error: error.message,
          });
        }
      }

      /**
       * 获取支持的语言列表
       * @return {Promise<Array>}
       */
      async getSupportedLanguages() {
        try {
          const results = await this.model.findAll({
            attributes: [[this.ctx.app.Sequelize.fn('DISTINCT', this.ctx.app.Sequelize.col('language')), 'language']],
            raw: true,
          });
          return results.map(r => r.language);
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] getSupportedLanguages failed:', error);
          throw this.exceptions.RepositoryError('Failed to get supported languages', {
            error: error.message,
          });
        }
      }

      /**
       * 递增模板使用次数
       * @param {String} id 模板ID
       * @return {Promise<Object>}
       */
      async incrementUsageCount(id) {
        try {
          const template = await this.model.findByPk(id);

          if (!template) {
            throw this.exceptions.NotFoundError('Prompt Template not found', { id });
          }

          const stats = template.statistics || {};
          stats.usageCount = (stats.usageCount || 0) + 1;
          stats.lastUsedAt = new Date();

          template.statistics = stats;
          await template.save();

          return template.toJSON();
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] incrementUsageCount failed:', error);
          throw this.exceptions.RepositoryError('Failed to increment usage count', {
            id,
            error: error.message,
          });
        }
      }

      /**
       * 根据任务类型查找所有版本
       * @param {String} taskType 任务类型
       * @param {String} language 语言代码
       * @return {Promise<Array>}
       */
      async findVersionsByTaskType(taskType, language) {
        try {
          return await this.find(
            { isPaging: '0' },
            {
              filters: {
                taskType: { $eq: taskType },
                language: { $eq: language },
              },
              sort: [{ field: 'version', order: 'desc' }],
            }
          );
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] findVersionsByTaskType failed:', error);
          throw this.exceptions.RepositoryError('Failed to find versions by task type', {
            taskType,
            language,
            error: error.message,
          });
        }
      }

      /**
       * 获取最新版本的模板
       * @param {String} taskType 任务类型
       * @param {String} language 语言代码
       * @return {Promise<Object|null>}
       */
      async findLatestVersion(taskType, language) {
        try {
          return await this.findByTaskTypeAndLanguage(taskType, language);
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] findLatestVersion failed:', error);
          throw this.exceptions.RepositoryError('Failed to find latest version', {
            taskType,
            language,
            error: error.message,
          });
        }
      }

      /**
       * 批量创建多语言模板
       * @param {String} taskType 任务类型
       * @param {Object} templates 多语言模板
       * @return {Promise<Array>}
       */
      async createMultiLanguageTemplates(taskType, templates) {
        try {
          const createdTemplates = [];

          for (const [language, templateData] of Object.entries(templates)) {
            const template = await this.create({
              taskType,
              language,
              ...templateData,
            });
            createdTemplates.push(template);
          }

          return createdTemplates;
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] createMultiLanguageTemplates failed:', error);
          throw this.exceptions.RepositoryError('Failed to create multi-language templates', {
            taskType,
            error: error.message,
          });
        }
      }

      /**
       * 更新模板效果统计
       * @param {String} id 模板ID
       * @param {Object} effectStats 效果统计
       * @return {Promise<Object>}
       */
      async updateEffectStats(id, effectStats) {
        try {
          const template = await this.model.findByPk(id);

          if (!template) {
            throw this.exceptions.NotFoundError('Prompt Template not found', { id });
          }

          const currentStats = template.statistics || {};
          const currentEffectiveness = template.effectiveness || {};

          if (effectStats.successRate !== undefined) {
            currentEffectiveness.qualityScore = effectStats.successRate * 100;
          }
          if (effectStats.averageScore !== undefined) {
            currentStats.averageScore = effectStats.averageScore;
          }
          if (effectStats.adoptionRate !== undefined) {
            currentEffectiveness.adoptionRate = effectStats.adoptionRate;
          }

          template.statistics = currentStats;
          template.effectiveness = currentEffectiveness;
          await template.save();

          return template.toJSON();
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] updateEffectStats failed:', error);
          throw this.exceptions.RepositoryError('Failed to update effect stats', {
            id,
            error: error.message,
          });
        }
      }

      /**
       * 查找启用的模板
       * @param {String} taskType 任务类型
       * @param {Object} options 查询选项
       * @return {Promise<Array>}
       */
      async findEnabledTemplates(taskType = null, options = {}) {
        try {
          const filters = { isEnabled: { $eq: true } };

          if (taskType) {
            filters.taskType = { $eq: taskType };
          }

          return await this.find(
            { isPaging: '0' },
            {
              filters,
              sort: [{ field: 'priority', order: 'desc' }],
              ...options,
            }
          );
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] findEnabledTemplates failed:', error);
          throw this.exceptions.RepositoryError('Failed to find enabled templates', {
            taskType,
            error: error.message,
          });
        }
      }

      /**
       * 根据标签查找模板
       * @param {Array} tags 标签数组
       * @param {Object} options 查询选项
       * @return {Promise<Array>}
       */
      async findByTags(tags, options = {}) {
        try {
          // MariaDB JSON 数组查询
          // 需要遍历标签，构建 OR 查询
          const filters = {
            $or: tags.map(tag => ({
              tags: { $contains: tag },
            })),
          };

          return await this.find(
            { isPaging: '0' },
            {
              filters,
              ...options,
            }
          );
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] findByTags failed:', error);
          throw this.exceptions.RepositoryError('Failed to find templates by tags', {
            tags,
            error: error.message,
          });
        }
      }

      /**
       * 克隆模板
       * @param {String} templateId 原模板ID
       * @param {Object} newData 新模板数据
       * @return {Promise<Object>}
       */
      async cloneTemplate(templateId, newData = {}) {
        try {
          const originalTemplate = await this.findById(templateId);

          if (!originalTemplate) {
            throw this.exceptions.NotFoundError('Prompt Template not found', { templateId });
          }

          // 创建新模板，继承原模板的大部分属性
          const clonedTemplate = await this.create({
            ...originalTemplate,
            ...newData,
            id: undefined, // 重新生成ID
            parentTemplateId: templateId,
            statistics: {
              usageCount: 0,
              successCount: 0,
              failureCount: 0,
              averageScore: 0,
              lastUsedAt: null,
            },
          });

          return clonedTemplate;
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] cloneTemplate failed:', error);
          throw this.exceptions.RepositoryError('Failed to clone template', {
            templateId,
            error: error.message,
          });
        }
      }

      /**
       * 批量启用/禁用模板
       * @param {Array} templateIds 模板ID数组
       * @param {Boolean} isEnabled 是否启用
       * @return {Promise<Object>}
       */
      async batchUpdateStatus(templateIds, isEnabled) {
        try {
          const [affectedCount] = await this.model.update(
            { isEnabled },
            {
              where: {
                id: templateIds,
              },
            }
          );

          return {
            modifiedCount: affectedCount,
            matchedCount: affectedCount,
          };
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] batchUpdateStatus failed:', error);
          throw this.exceptions.RepositoryError('Failed to batch update status', {
            templateIds,
            isEnabled,
            error: error.message,
          });
        }
      }

      /**
       * 获取热门模板
       * @param {Number} limit 返回数量限制
       * @param {String} taskType 任务类型
       * @return {Promise<Array>}
       */
      async getPopularTemplates(limit = 10, taskType = null) {
        try {
          const filters = { isEnabled: { $eq: true } };

          if (taskType) {
            filters.taskType = { $eq: taskType };
          }

          // MariaDB: 由于 statistics 是 JSON 字段，排序较复杂
          // 先获取所有数据，然后在应用层排序
          const templates = await this.find(
            { isPaging: '0' },
            {
              filters,
            }
          );

          // 按使用次数排序
          templates.sort((a, b) => {
            const aCount = a.statistics?.usageCount || 0;
            const bCount = b.statistics?.usageCount || 0;
            return bCount - aCount;
          });

          return templates.slice(0, limit);
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] getPopularTemplates failed:', error);
          throw this.exceptions.RepositoryError('Failed to get popular templates', {
            limit,
            taskType,
            error: error.message,
          });
        }
      }

      /**
       * 验证模板语法
       * @param {String} templateContent 模板内容
       * @return {Promise<Object>}
       */
      async validateTemplateSyntax(templateContent) {
        try {
          const errors = [];

          // 检查变量语法 {{variableName}}
          const variableRegex = /\{\{([^}]+)\}\}/g;
          const variables = [];
          let match;

          while ((match = variableRegex.exec(templateContent)) !== null) {
            const varName = match[1].trim();
            if (!varName) {
              errors.push(`Empty variable placeholder at position ${match.index}`);
            } else {
              variables.push(varName);
            }
          }

          // 检查是否有未闭合的括号
          const openBrackets = (templateContent.match(/\{\{/g) || []).length;
          const closeBrackets = (templateContent.match(/\}\}/g) || []).length;
          if (openBrackets !== closeBrackets) {
            errors.push('Mismatched brackets in template');
          }

          return {
            isValid: errors.length === 0,
            errors,
            variables,
          };
        } catch (error) {
          this.ctx.logger.error('[PromptTemplateMariaRepository] validateTemplateSyntax failed:', error);
          throw this.exceptions.RepositoryError('Failed to validate template syntax', {
            error: error.message,
          });
        }
      }
    };
  }

  return PromptTemplateMariaRepositoryClass;
}

// 导出工厂函数，在注册时调用以获取类
module.exports = getPromptTemplateMariaRepository;
