/**
 * ContentCategoryRelation MariaDB Schema 定义
 * Content 与 ContentCategory 的多对多关联表
 * 🔥 支持 MongoDB 数据迁移的中间表设计
 */
'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  /**
   * 定义 ContentCategoryRelation 中间表结构
   * @param {Sequelize} sequelize Sequelize 实例
   * @return {Model} ContentCategoryRelation 模型
   */
  define(sequelize) {
    const ContentCategoryRelation = sequelize.define(
      'ContentCategoryRelation',
      {
        // 复合主键
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

        // 分类ID（软引用，不创建外键约束）
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '分类ID',
        },

        // 关联权重（可选，用于排序）
        sort_order: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          comment: '关联排序权重',
        },

        // 关联类型（可选，支持不同类型的关联）
        relation_type: {
          type: DataTypes.ENUM('primary', 'secondary', 'tag'),
          defaultValue: 'primary',
          comment: '关联类型: primary-主分类, secondary-副分类, tag-标签式',
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
        tableName: 'content_category_relations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        comment: 'Content与ContentCategory多对多关联表',

        // 索引配置
        indexes: [
          {
            name: 'idx_content_category_unique',
            unique: true,
            fields: ['content_id', 'category_id'],
            comment: '内容-分类唯一约束',
          },
          {
            name: 'idx_content_id',
            fields: ['content_id'],
            comment: '内容ID索引',
          },
          {
            name: 'idx_category_id',
            fields: ['category_id'],
            comment: '分类ID索引',
          },

          {
            name: 'idx_relation_type',
            fields: ['relation_type', 'sort_order'],
            comment: '关联类型和排序索引',
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

    return ContentCategoryRelation;
  },

  /**
   * 定义关联关系
   * @param {Object} models 所有模型
   */
  associate(models) {
    // 中间表通常不需要定义额外的关联
    // 关联关系由 Content 和 ContentCategory 模型定义
  },

  /**
   * 批量操作辅助方法
   */
  helpers: {
    /**
     * 批量创建关联关系
     * @param {Model} model ContentCategoryRelation 模型
     * @param {Object} contentCategoryMap 内容-分类映射
     * @return {Promise} 创建结果
     */
    async bulkCreateRelations(model, contentCategoryMap) {
      const relations = [];

      for (const [contentId, categoryIds] of Object.entries(contentCategoryMap)) {
        if (Array.isArray(categoryIds)) {
          categoryIds.forEach((categoryId, index) => {
            relations.push({
              content_id: contentId,
              category_id: categoryId,
              sort_order: index,
              relation_type: index === 0 ? 'primary' : 'secondary',
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
     * 更新内容的分类关联
     * @param {Model} model ContentCategoryRelation 模型
     * @param {Number} contentId 内容ID
     * @param {Array} categoryIds 分类ID数组
     * @return {Promise} 更新结果
     */
    async updateContentCategories(model, contentId, categoryIds) {
      // 删除现有关联
      await model.destroy({
        where: { content_id: contentId },
      });

      // 创建新关联
      if (categoryIds && categoryIds.length > 0) {
        const relations = categoryIds.map((categoryId, index) => ({
          content_id: contentId,
          category_id: categoryId,
          sort_order: index,
          relation_type: index === 0 ? 'primary' : 'secondary',
        }));

        return await model.bulkCreate(relations);
      }

      return [];
    },
  },
};
