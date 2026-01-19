/**
 * ContentTagRelation MariaDB Schema 定义
 * Content 与 ContentTag 的多对多关联表
 * 🔥 基于ContentCategoryRelation经验，优化设计
 */
'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  /**
   * 定义 ContentTagRelation 中间表结构
   * @param {Sequelize} sequelize Sequelize 实例
   * @return {Model} ContentTagRelation 模型
   */
  define(sequelize) {
    const ContentTagRelation = sequelize.define(
      'ContentTagRelation',
      {
        // 自增主键
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: '自增主键',
        },

        // 内容ID（软引用，不创建外键约束）
        content_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '内容ID',
        },

        // 标签ID（软引用，不创建外键约束）
        tag_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '标签ID',
        },

        // 标签权重（用于排序）
        sort_order: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          comment: '标签排序权重',
        },

        // 标签重要性
        importance: {
          type: DataTypes.ENUM('high', 'medium', 'low'),
          defaultValue: 'medium',
          comment: '标签重要性: high-核心标签, medium-普通标签, low-次要标签',
        },

        // 时间戳
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: '创建时间',
        },

        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: '更新时间',
        },
      },
      {
        // 表配置
        tableName: 'content_tag_relations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        comment: 'Content与ContentTag多对多关联表',

        // 索引配置
        indexes: [
          {
            name: 'idx_content_tag_unique',
            unique: true,
            fields: ['content_id', 'tag_id'],
            comment: '内容-标签唯一约束',
          },
          {
            name: 'idx_content_id',
            fields: ['content_id'],
            comment: '内容ID索引',
          },
          {
            name: 'idx_tag_id',
            fields: ['tag_id'],
            comment: '标签ID索引',
          },
          {
            name: 'idx_importance_order',
            fields: ['importance', 'sort_order'],
            comment: '重要性和排序索引',
          },
        ],

        // 钩子方法
        hooks: {
          beforeCreate: (instance, options) => {
            instance.updated_at = new Date();
          },
          beforeUpdate: (instance, options) => {
            instance.updated_at = new Date();
          },
        },
      }
    );

    return ContentTagRelation;
  },

  /**
   * 定义关联关系
   * @param {Object} models 所有模型
   */
  associate(models) {
    // 中间表通常不需要定义额外的关联
    // 关联关系由 Content 和 ContentTag 模型定义
  },

  /**
   * 批量操作辅助方法
   */
  helpers: {
    /**
     * 批量创建标签关联关系
     * @param {Model} model ContentTagRelation 模型
     * @param {Object} contentTagMap 内容-标签映射
     * @return {Promise} 创建结果
     */
    async bulkCreateRelations(model, contentTagMap) {
      const relations = [];

      for (const [contentId, tagIds] of Object.entries(contentTagMap)) {
        if (Array.isArray(tagIds)) {
          tagIds.forEach((tagId, index) => {
            relations.push({
              content_id: contentId,
              tag_id: tagId,
              sort_order: index,
              importance: index < 3 ? 'high' : index < 6 ? 'medium' : 'low',
            });
          });
        }
      }

      return await model.bulkCreate(relations, {
        ignoreDuplicates: true,
        validate: true,
      });
    },

    /**
     * 更新内容的标签关联
     * @param {Model} model ContentTagRelation 模型
     * @param {Number} contentId 内容ID
     * @param {Array} tagIds 标签ID数组
     * @return {Promise} 更新结果
     */
    async updateContentTags(model, contentId, tagIds) {
      // 删除现有关联
      await model.destroy({
        where: { content_id: contentId },
      });

      // 创建新关联
      if (tagIds && tagIds.length > 0) {
        const relations = tagIds.map((tagId, index) => ({
          content_id: contentId,
          tag_id: tagId,
          sort_order: index,
          importance: index < 3 ? 'high' : index < 6 ? 'medium' : 'low',
        }));

        return await model.bulkCreate(relations);
      }

      return [];
    },

    /**
     * 获取内容的标签（按重要性和排序）
     * @param {Model} model ContentTagRelation 模型
     * @param {Number} contentId 内容ID
     * @param {Object} options 查询选项
     * @return {Promise} 标签列表
     */
    async getContentTags(model, contentId, options = {}) {
      const { importance, limit } = options;

      const whereCondition = { content_id: contentId };
      if (importance) {
        whereCondition.importance = importance;
      }

      const queryOptions = {
        where: whereCondition,
        order: [
          ['importance', 'DESC'],
          ['sort_order', 'ASC'],
        ],
      };

      if (limit) {
        queryOptions.limit = limit;
      }

      return await model.findAll(queryOptions);
    },

    /**
     * 获取标签的内容统计
     * @param {Model} model ContentTagRelation 模型
     * @param {Array} tagIds 标签ID数组
     * @return {Promise} 统计结果
     */
    async getTagContentStats(model, tagIds) {
      const { Sequelize } = require('sequelize');

      return await model.findAll({
        attributes: [
          'tag_id',
          [Sequelize.fn('COUNT', Sequelize.col('content_id')), 'content_count'],
          [
            Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN importance = 'high' THEN 1 END")),
            'high_importance_count',
          ],
        ],
        where: {
          tag_id: { [Sequelize.Op.in]: tagIds },
        },
        group: ['tag_id'],
        raw: true,
      });
    },
  },
};
