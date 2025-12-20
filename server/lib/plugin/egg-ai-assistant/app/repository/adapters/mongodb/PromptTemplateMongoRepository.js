/**
 * Prompt Template MongoDB Repository
 * 继承 BaseMongoRepository，实现提示词模板的数据访问
 *
 * 使用工厂函数模式动态创建类，解决 npm 发布后的路径问题
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const BaseRepositoryLoader = require('../../base/BaseRepositoryLoader');

/**
 * 创建 PromptTemplate MongoDB Repository 类
 * @param {Application} app - EggJS Application 实例
 * @return {Class} PromptTemplateMongoRepository 类
 */
function createPromptTemplateMongoRepository(app) {
  // 动态加载基类
  const BaseMongoRepository = BaseRepositoryLoader.getBaseMongoRepository(app);

  // 动态创建继承类
  class PromptTemplateMongoRepository extends BaseMongoRepository {
    constructor(ctx) {
      super(ctx, 'PromptTemplate');

      // 设置 MongoDB Model
      this.model = ctx.model.PromptTemplate;

      // 注册模型和关联关系
      this.registerModel({
        mongoModel: this.model,
        relations: {
          parentTemplate: {
            model: ctx.model.PromptTemplate,
            path: 'parentTemplateId',
            select: ['name', 'version', 'taskType', 'id'],
          },
          createdBy: {
            model: ctx.app.model.Admin,
            path: 'createdBy',
            select: ['userName', 'name', 'id'],
          },
          updatedBy: {
            model: ctx.app.model.Admin,
            path: 'updatedBy',
            select: ['userName', 'name', 'id'],
          },
        },
      });
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
        const result = await this.findOne({
          filters: {
            taskType: { $eq: taskType },
            language: { $eq: language },
            isEnabled: { $eq: true },
          },
          sort: [
            { field: 'priority', order: 'desc' },
            { field: 'version', order: 'desc' },
          ],
        });
        return result;
      } catch (error) {
        this.ctx.logger.error('[PromptTemplateMongoRepository] findByTaskTypeAndLanguage failed:', error);
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
        return await this.model.distinct('taskType');
      } catch (error) {
        this.ctx.logger.error('[PromptTemplateMongoRepository] getTaskTypes failed:', error);
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
        return await this.model.distinct('language');
      } catch (error) {
        this.ctx.logger.error('[PromptTemplateMongoRepository] getSupportedLanguages failed:', error);
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
        const result = await this.model.findByIdAndUpdate(
          id,
          {
            $inc: { 'statistics.usageCount': 1 },
            $set: { 'statistics.lastUsedAt': new Date() },
          },
          { new: true, runValidators: true }
        );

        if (!result) {
          throw this.exceptions.NotFoundError('Prompt Template not found', { id });
        }

        return this._mapIdFromDatabase(result.toObject());
      } catch (error) {
        this.ctx.logger.error('[PromptTemplateMongoRepository] incrementUsageCount failed:', error);
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
        this.ctx.logger.error('[PromptTemplateMongoRepository] findVersionsByTaskType failed:', error);
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
        this.ctx.logger.error('[PromptTemplateMongoRepository] findLatestVersion failed:', error);
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
        this.ctx.logger.error('[PromptTemplateMongoRepository] createMultiLanguageTemplates failed:', error);
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
        const updateData = { $set: {} };

        if (effectStats.successRate !== undefined) {
          updateData.$set['effectiveness.qualityScore'] = effectStats.successRate * 100;
        }
        if (effectStats.averageScore !== undefined) {
          updateData.$set['statistics.averageScore'] = effectStats.averageScore;
        }
        if (effectStats.adoptionRate !== undefined) {
          updateData.$set['effectiveness.adoptionRate'] = effectStats.adoptionRate;
        }

        const result = await this.model.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        });

        if (!result) {
          throw this.exceptions.NotFoundError('Prompt Template not found', { id });
        }

        return this._mapIdFromDatabase(result.toObject());
      } catch (error) {
        this.ctx.logger.error('[PromptTemplateMongoRepository] updateEffectStats failed:', error);
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
            sort: [
              { field: 'priority', order: 'desc' },
              { field: 'statistics.usageCount', order: 'desc' },
            ],
            ...options,
          }
        );
      } catch (error) {
        this.ctx.logger.error('[PromptTemplateMongoRepository] findEnabledTemplates failed:', error);
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
        return await this.find(
          { isPaging: '0' },
          {
            filters: {
              tags: { $in: tags },
            },
            ...options,
          }
        );
      } catch (error) {
        this.ctx.logger.error('[PromptTemplateMongoRepository] findByTags failed:', error);
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
          _id: undefined, // 重新生成ID
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
        this.ctx.logger.error('[PromptTemplateMongoRepository] cloneTemplate failed:', error);
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
        const result = await this.model.updateMany({ _id: { $in: templateIds } }, { $set: { isEnabled } });

        return {
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
        };
      } catch (error) {
        this.ctx.logger.error('[PromptTemplateMongoRepository] batchUpdateStatus failed:', error);
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

        return await this.find(
          { current: 1, pageSize: limit },
          {
            filters,
            sort: [{ field: 'statistics.usageCount', order: 'desc' }],
          }
        );
      } catch (error) {
        this.ctx.logger.error('[PromptTemplateMongoRepository] getPopularTemplates failed:', error);
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
        this.ctx.logger.error('[PromptTemplateMongoRepository] validateTemplateSyntax failed:', error);
        throw this.exceptions.RepositoryError('Failed to validate template syntax', {
          error: error.message,
        });
      }
    }
  }

  return PromptTemplateMongoRepository;
}

/**
 * 导出工厂函数
 * 用法：const PromptTemplateMongoRepository = require('...')(app);
 */
module.exports = createPromptTemplateMongoRepository;
