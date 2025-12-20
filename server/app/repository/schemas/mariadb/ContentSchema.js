/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: Content MariaDB Schema 定义 - 基于 MongoDB 模型设计
 */

'use strict';

const { DataTypes } = require('sequelize');

/**
 * Content Schema for MariaDB
 * 内容表结构定义 - 基于 MongoDB 模型设计，支持多种关联关系
 * @param sequelize
 * @param app
 */
const ContentSchema = (sequelize, app) => {
  const Content = sequelize.define(
    'Content',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 🔥 核心内容字段（与 MongoDB 模型一致）
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '标题',
        validate: {
          notEmpty: true,
          len: [2, 200],
        },
      },

      stitle: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '副标题/短标题',
        validate: {
          len: [0, 200],
        },
      },

      type: {
        type: DataTypes.STRING(10),
        defaultValue: '1',
        comment: '发布类型：1-普通文章，2-专题',
        validate: {
          isIn: [['1', '2']],
        },
      },

      // 🔥 关联关系字段已移除 - 完全使用标准关联表
      // categories 和 tags 字段已移除，数据完全由关联表维护
      // 通过 categories 和 tags 关联获取数据

      sortPath: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
        comment: '存储所有父节点结构路径',
      },

      keywords: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '关键词数组(JSON格式)',
        get() {
          const value = this.getDataValue('keywords');
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              return Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
              return [];
            }
          }
          return [];
        },
        set(value) {
          if (Array.isArray(value)) {
            this.setDataValue('keywords', value);
          } else {
            this.setDataValue('keywords', []);
          }
        },
      },

      // 🔥 媒体相关字段
      sImg: {
        type: DataTypes.STRING(500),
        defaultValue: '/upload/images/defaultImg.jpg',
        comment: '文章缩略图',
      },

      sImgType: {
        type: DataTypes.STRING(10),
        defaultValue: '2',
        comment: '首图类型：1-自动生成，2-本地上传',
        validate: {
          isIn: [['1', '2']],
        },
      },

      cover: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '封面ID',
      },

      videoImg: {
        type: DataTypes.STRING(500),
        defaultValue: '',
        comment: '视频缩略图',
      },

      appShowType: {
        type: DataTypes.STRING(10),
        defaultValue: '1',
        comment: 'APP端排版格式：0-不显示图片，1-小图，2-大图，3-视频',
        validate: {
          isIn: [['0', '1', '2', '3']],
        },
      },

      imageArr: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '媒体集合-图片数组(JSON格式)',
        get() {
          const value = this.getDataValue('imageArr');
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return [];
            }
          }
          return [];
        },
        set(value) {
          this.setDataValue('imageArr', Array.isArray(value) ? value : []);
        },
      },

      videoArr: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '媒体集合-视频数组(JSON格式)',
        get() {
          const value = this.getDataValue('videoArr');
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return [];
            }
          }
          return [];
        },
        set(value) {
          this.setDataValue('videoArr', Array.isArray(value) ? value : []);
        },
      },

      duration: {
        type: DataTypes.STRING(20),
        defaultValue: '0:01',
        comment: '视频时长',
      },

      // 🔥 内容字段
      discription: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
        comment: '内容描述/摘要',
      },

      source: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '来源',
      },

      comments: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        comment: '正文内容',
      },

      simpleComments: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        comment: '带格式的纯文本',
      },

      markDownComments: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        comment: 'Markdown格式内容',
      },

      // 🔥 作者关联字段
      author: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '管理员作者ID - 关联admin表',
      },

      uAuthor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '普通用户作者ID - 关联user表',
      },

      // 🔥 状态管理字段
      state: {
        type: DataTypes.STRING(10),
        defaultValue: '0',
        comment: '状态：0-草稿，1-待审核，2-审核通过，3-下架',
        validate: {
          isIn: [['0', '1', '2', '3']],
        },
      },

      draft: {
        type: DataTypes.STRING(10),
        defaultValue: '0',
        comment: '是否进入回收站：0-否，1-是',
        validate: {
          isIn: [['0', '1']],
        },
      },

      dismissReason: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
        comment: '驳回原因(针对审核不通过)',
      },

      // 🔥 推荐和置顶字段
      isTop: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '是否推荐：0-不推荐，1-推荐',
        validate: {
          isIn: [[0, 1]],
        },
      },

      roofPlacement: {
        type: DataTypes.STRING(10),
        defaultValue: '0',
        comment: '是否置顶：0-不置顶，1-置顶',
        validate: {
          isIn: [['0', '1']],
        },
      },

      // 🔥 统计字段
      clickNum: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '点击数量',
      },

      commentNum: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '评论数',
      },

      likeNum: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '点赞数(兼容旧版)',
      },

      // 🔥 新增：冗余计数字段
      praise_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '点赞数',
        field: 'praise_count',
      },
      favorite_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '收藏数',
        field: 'favorite_count',
      },
      despise_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '踩数',
        field: 'despise_count',
      },

      // 统一时间字段
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '创建时间',
        defaultValue: DataTypes.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '更新时间',
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false, // 使用自定义时间字段
      tableName: 'contents',
      comment: '内容表',

      // 🔥 添加虚拟字段以保持与 MongoDB 风格的兼容性
      getterMethods: {
        // 虚拟 URL 字段
        url() {
          return `/details/${this.id}.html`;
        },
      },

      // 🔥 数据验证
      validate: {
        titleRequired() {
          if (!this.title || this.title.trim() === '') {
            throw new Error('标题不能为空');
          }
        },

        stateValid() {
          if (!['0', '1', '2', '3'].includes(this.state)) {
            throw new Error('状态必须是 0（草稿）、1（待审核）、2（审核通过）或 3（下架）');
          }
        },

        typeValid() {
          if (!['1', '2'].includes(this.type)) {
            throw new Error('类型必须是 1（普通）或 2（专题）');
          }
        },

        authorValid() {
          // 必须至少有一个作者
          if (!this.author && !this.uAuthor) {
            throw new Error('必须指定作者（管理员或普通用户）');
          }
        },
      },

      hooks: {
        beforeUpdate(instance) {
          instance.updatedAt = new Date();
        },

        beforeBulkUpdate(options) {
          options.attributes.updatedAt = new Date();
        },

        beforeCreate(instance) {
          if (!instance.createdAt) {
            instance.createdAt = new Date();
          }
          if (!instance.updatedAt) {
            instance.updatedAt = new Date();
          }
        },

        // 🔥 数据验证钩子
        beforeValidate(instance) {
          // 确保 JSON 字段的默认值
          if (!instance.categories) {
            instance.categories = [];
          }
          if (!instance.tags) {
            instance.tags = [];
          }
          if (!instance.keywords) {
            instance.keywords = [];
          }
          if (!instance.imageArr) {
            instance.imageArr = [];
          }
          if (!instance.videoArr) {
            instance.videoArr = [];
          }
        },
      },

      // 索引定义
      indexes: [
        {
          fields: ['state'],
          name: 'idx_content_state',
        },
        {
          fields: ['author'],
          name: 'idx_content_author',
        },
        {
          fields: ['uAuthor'],
          name: 'idx_content_uauthor',
        },
        {
          fields: ['type'],
          name: 'idx_content_type',
        },
        {
          fields: ['isTop'],
          name: 'idx_content_istop',
        },
        {
          fields: ['roofPlacement'],
          name: 'idx_content_roof',
        },
        {
          fields: ['createdAt'],
          name: 'idx_content_created',
        },
        {
          fields: ['updatedAt'],
          name: 'idx_content_updated',
        },
        {
          fields: ['clickNum'],
          name: 'idx_content_click',
        },
        // 复合索引
        {
          fields: ['state', 'uAuthor'],
          name: 'idx_content_state_uauthor',
        },
        {
          fields: ['state', 'isTop', 'roofPlacement'],
          name: 'idx_content_state_top_roof',
        },
      ],
    }
  );

  // 定义关联关系
  Content.associate = models => {
    // 🔥 启用标准关联关系，同时保留JSON字段向后兼容
    // 作者关联（管理员）
    if (models.Admin) {
      Content.belongsTo(models.Admin, {
        foreignKey: 'author',
        as: 'adminAuthor',
        constraints: false, // 允许为空
      });
    }

    // 作者关联（普通用户）
    if (models.User) {
      Content.belongsTo(models.User, {
        foreignKey: 'uAuthor',
        as: 'userAuthor',
        constraints: false, // 允许为空
      });
    }

    // 🔥 分类关联 - 启用标准多对多关联
    if (models.ContentCategory) {
      Content.belongsToMany(models.ContentCategory, {
        through: 'content_category_relations',
        foreignKey: 'content_id',
        otherKey: 'category_id',
        as: 'categories',
        timestamps: true,
      });
    }

    // 🔥 标签关联 - 启用标准多对多关联
    if (models.ContentTag) {
      Content.belongsToMany(models.ContentTag, {
        through: 'content_tag_relations',
        foreignKey: 'content_id',
        otherKey: 'tag_id',
        as: 'tags',
        timestamps: true,
      });
    }
  };

  // 🔥 类方法
  Content.findByState = function (state) {
    return this.findAll({ where: { state } });
  };

  /**
   * 🔥 混合查询支持：同时支持JSON字段和关联表查询
   * 向后兼容迁移期间的双重数据源
   * @param categoryIds
   * @param options
   */
  Content.findWithCategories = async function (categoryIds, options = {}) {
    const { useRelations = true, fallbackToJson = true } = options;

    if (useRelations && this.associations.categories) {
      try {
        // 优先使用标准关联查询
        return await this.findAll({
          include: [
            {
              model: this.sequelize.models.ContentCategory,
              as: 'categories',
              where: { id: { [this.sequelize.Sequelize.Op.in]: categoryIds } },
              through: { attributes: [] },
            },
          ],
          ...options.queryOptions,
        });
      } catch (error) {
        console.warn('标准关联查询失败，回退到JSON查询:', error.message);
        if (!fallbackToJson) throw error;
      }
    }

    if (fallbackToJson) {
      // 回退到JSON字段查询
      const { Op } = this.sequelize.Sequelize;
      return await this.findAll({
        where: {
          [Op.or]: categoryIds.map(id => this.sequelize.literal(`JSON_CONTAINS(categories, '"${id}"')`)),
        },
        ...options.queryOptions,
      });
    }

    return [];
  };

  Content.findWithTags = async function (tagIds, options = {}) {
    const { useRelations = true, fallbackToJson = true } = options;

    if (useRelations && this.associations.tags) {
      try {
        // 优先使用标准关联查询
        return await this.findAll({
          include: [
            {
              model: this.sequelize.models.ContentTag,
              as: 'tags',
              where: { id: { [this.sequelize.Sequelize.Op.in]: tagIds } },
              through: { attributes: [] },
            },
          ],
          ...options.queryOptions,
        });
      } catch (error) {
        console.warn('标准关联查询失败，回退到JSON查询:', error.message);
        if (!fallbackToJson) throw error;
      }
    }

    if (fallbackToJson) {
      // 回退到JSON字段查询
      const { Op } = this.sequelize.Sequelize;
      return await this.findAll({
        where: {
          [Op.or]: tagIds.map(id => this.sequelize.literal(`JSON_CONTAINS(tags, '"${id}"')`)),
        },
        ...options.queryOptions,
      });
    }

    return [];
  };

  Content.findByAuthor = function (authorId, authorType = 'uAuthor') {
    const field = authorType === 'admin' ? 'author' : 'uAuthor';
    return this.findAll({
      where: { [field]: authorId },
      order: [
        ['roofPlacement', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  Content.findByType = function (type) {
    return this.findAll({
      where: { type },
      order: [
        ['roofPlacement', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  Content.findPublished = function () {
    return this.findAll({
      where: {
        state: '2',
        draft: { [sequelize.Sequelize.Op.ne]: '1' },
      },
      order: [
        ['roofPlacement', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  Content.findTopContents = function (limit = 10) {
    return this.findAll({
      where: {
        state: '2',
        isTop: 1,
        draft: { [sequelize.Sequelize.Op.ne]: '1' },
      },
      order: [
        ['roofPlacement', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
    });
  };

  // 🔥 实例方法
  Content.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 添加虚拟 URL 字段
    values.url = `/details/${values.id}.html`;

    // 🔥 格式化日期（使用 moment 格式化）
    if (values.createdAt) {
      const moment = require('moment');
      values.createdAt = moment(values.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (values.updatedAt) {
      const moment = require('moment');
      values.updatedAt = moment(values.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // 🔥 添加状态文本描述
    const stateMap = {
      0: '草稿',
      1: '待审核',
      2: '已发布',
      3: '已下架',
    };
    values.stateText = stateMap[values.state] || '未知状态';

    // 🔥 添加类型文本描述
    const typeMap = {
      1: '普通文章',
      2: '专题文章',
    };
    values.typeText = typeMap[values.type] || '未知类型';

    return values;
  };

  Content.prototype.getDisplayTitle = function () {
    return this.stitle || this.title || `Content-${this.id}`;
  };

  Content.prototype.isPublished = function () {
    return this.state === '2' && this.draft !== '1';
  };

  Content.prototype.isDraft = function () {
    return this.state === '0' || this.draft === '1';
  };

  Content.prototype.isTopContent = function () {
    return this.isTop === 1;
  };

  Content.prototype.isRoof = function () {
    return this.roofPlacement === '1';
  };

  return Content;
};

module.exports = ContentSchema;
