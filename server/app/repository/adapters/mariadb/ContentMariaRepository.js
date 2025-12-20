/**
 * Content MariaDB Repository
 * 🔥 基于 BaseMariaRepository，处理JSON字段关联优化
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
// const ContentSchema = require('../../schemas/mariadb/ContentSchema');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');

class ContentMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'Content');
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;
  }

  async _initializeConnection() {
    try {
      // 确保连接管理器已初始化
      await this.connection.initialize();

      // 🔥 修复：使用连接管理器中已建立关联关系的模型
      this.model = this.connection.getModel('Content');

      if (!this.model) {
        throw new Error('Content 模型未找到，请检查模型加载顺序');
      }

      // 🔥 注册Content关联关系 - 修复populate转换问题
      this.registerModel({
        mariaModel: this.model,
        relations: {
          adminAuthor: {
            model: this.connection.getModel('Admin'),
            type: 'belongsTo',
            foreignKey: 'author',
            as: 'adminAuthor',
            select: ['id', 'userName', 'nickName'],
          },
          userAuthor: {
            model: this.connection.getModel('User'),
            type: 'belongsTo',
            foreignKey: 'uAuthor',
            as: 'userAuthor',
            select: ['id', 'userName', 'name', 'status'],
          },
          categories: {
            model: this.connection.getModel('ContentCategory'),
            type: 'belongsToMany',
            through: 'content_category_relations',
            foreignKey: 'content_id',
            otherKey: 'category_id',
            as: 'categories',
            select: ['id', 'name', 'url'], // ✅ 优化：与原手动构建保持一致
          },
          tags: {
            model: this.connection.getModel('ContentTag'),
            type: 'belongsToMany',
            through: 'content_tag_relations',
            foreignKey: 'content_id',
            otherKey: 'tag_id',
            as: 'tags',
            select: ['id', 'name', 'alias'], // ✅ 优化：与原手动构建保持一致
          },
        },
      });

      // 🔥 调试：检查关联关系是否正确注册
      // console.log('🔍 Content 模型关联:', Object.keys(this.model.associations || {}));
      // console.log('✅ ContentMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ ContentMariaRepository initialization failed:', error);
      throw error;
    }
  }

  async _ensureConnection() {
    if (!this.model) await this._initializeConnection();
  }

  /**
   * 🔥 优化：支持标准关联查询
   * 返回可用的关联配置
   */
  _getDefaultPopulate() {
    return ['adminAuthor', 'userAuthor', 'categories', 'tags'];
  }
  _getDefaultSearchKeys() {
    return ['title', 'stitle', 'discription', 'comments'];
  }
  _getDefaultSort() {
    return [
      { field: 'roofPlacement', order: 'desc' },
      { field: 'createdAt', order: 'desc' },
    ];
  }
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.CONTENT.STATUS_TEXT;
  }

  _customProcessDataItem(item) {
    if (!item) return item;
    item = super._customProcessDataItem(item);

    // 🔥 字段名映射：将 adminAuthor 映射为 author，userAuthor 映射为 uAuthor
    if (item.adminAuthor) {
      item.author = item.adminAuthor;
      delete item.adminAuthor;
    }
    if (item.userAuthor) {
      item.uAuthor = item.userAuthor;
      delete item.userAuthor;
    }

    // 🔥 优化：字段名统一后，无需转换
    // categories 和 tags 直接由关联查询提供，格式已经正确
    if (!item.categories || !Array.isArray(item.categories)) {
      item.categories = [];
      if (item.id) {
        // console.log(`📊 Content ${item.id}: 没有分类关联数据`);
      }
    }

    if (!item.tags || !Array.isArray(item.tags)) {
      item.tags = [];
      if (item.id) {
        // console.log(`📊 Content ${item.id}: 没有标签关联数据`);
      }
    }

    // 处理其他JSON字段
    ['keywords', 'imageArr', 'videoArr'].forEach(field => {
      if (item[field] && typeof item[field] === 'string') {
        try {
          item[field] = JSON.parse(item[field]);
        } catch (e) {
          item[field] = [];
        }
      }
      item[field] = item[field] || [];
    });

    // 添加类型文本
    if (item.type) {
      item.typeText = item.type === '1' ? '普通文章' : '专题文章';
    }

    // 添加URL
    if (item.title) item.url = `/details/${item.id}.html`;

    return item;
  }

  _customPreprocessForCreate(data) {
    if (!data.title?.trim()) throw this.exceptions.content.titleRequired();
    if (!data.author && !data.uAuthor) throw this.exceptions.content.authorRequired();

    data = super._customPreprocessForCreate(data);

    // 🔥 转换布尔值为数字（MariaDB Schema 要求数字类型）
    if (data.isTop !== undefined) {
      data.isTop = data.isTop ? 1 : 0;
    }

    // 🔥 转换布尔值为字符串（MariaDB Schema 要求字符串类型）
    if (data.roofPlacement !== undefined) {
      data.roofPlacement = data.roofPlacement ? '1' : '0';
    }

    // 设置默认值
    Object.assign(data, {
      type: data.type || '1',
      state: data.state || '0',
      draft: data.draft || '0',
      isTop: data.isTop !== undefined ? data.isTop : 0, // 已经转换过了
      roofPlacement: data.roofPlacement !== undefined ? data.roofPlacement : '0', // 已经转换过了
      clickNum: data.clickNum || 1,
      commentNum: data.commentNum || 0,
      likeNum: data.likeNum || 0,
      stitle: data.stitle || data.title,
    });

    // 确保其他JSON字段格式
    ['keywords', 'imageArr', 'videoArr'].forEach(field => {
      data[field] = Array.isArray(data[field]) ? data[field] : [];
    });

    return data;
  }

  _customPreprocessForUpdate(data) {
    // 🔥 软删除操作时跳过标题验证
    const isSoftDelete =
      data.draft && Object.keys(data).filter(key => key !== 'draft' && key !== 'updatedAt').length === 0;

    if (!isSoftDelete && data.title !== undefined && !data.title?.trim()) {
      throw this.exceptions.content.titleRequired();
    }

    data = super._customPreprocessForUpdate(data);

    // 🔥 转换布尔值为数字（MariaDB Schema 要求数字类型）
    if (data.isTop !== undefined) {
      data.isTop = data.isTop ? 1 : 0;
    }

    // 🔥 转换布尔值为字符串（MariaDB Schema 要求字符串类型）
    if (data.roofPlacement !== undefined) {
      data.roofPlacement = data.roofPlacement ? '1' : '0';
    }

    // 🔥 优化：不再更新 categories 和 tags JSON 字段
    // 如果传入了这些字段，设为空数组（数据完全由关联表维护）
    // if (data.categories !== undefined) {
    //   data.categories = [];
    // }
    // if (data.tags !== undefined) {
    //   data.tags = [];
    // }

    // 确保其他JSON字段格式
    ['keywords', 'imageArr', 'videoArr'].forEach(field => {
      if (data[field] !== undefined) {
        data[field] = Array.isArray(data[field]) ? data[field] : [];
      }
    });

    return data;
  }

  /**
   * 🔥 处理分类和标签关联的通用方法
   * @param {Object} instance 模型实例
   * @param {Object} data 包含关联数据的对象
   * @param {Transaction} transaction 事务对象
   * @param {String} operation 操作类型 ('create' | 'update')
   * @private
   */
  async _handleRelationships(instance, data, transaction, operation = 'create') {
    const promises = [];

    // 处理分类关联
    if (data.categories !== undefined && this.model.associations.categories) {
      const categoryIds = data.categories || [];
      const categoryPromise = this._handleCategoryRelation(instance, categoryIds, transaction, operation);
      promises.push(categoryPromise);
    }

    // 处理标签关联
    if (data.tags !== undefined && this.model.associations.tags) {
      const tagIds = data.tags || [];
      const tagPromise = this._handleTagRelation(instance, tagIds, transaction, operation);
      promises.push(tagPromise);
    }

    // 并行处理所有关联
    await Promise.all(promises);
  }

  /**
   * 🔥 处理分类关联的具体逻辑
   * @param {Object} instance 模型实例
   * @param {Array} categoryIds 分类ID数组
   * @param {Transaction} transaction 事务对象
   * @param {String} operation 操作类型
   * @private
   */
  async _handleCategoryRelation(instance, categoryIds, transaction, operation) {
    try {
      await instance.setCategories(categoryIds, { transaction });
      console.log(`✅ 成功${operation === 'create' ? '创建' : '更新'} ${categoryIds.length} 个分类关联`);
    } catch (error) {
      console.warn(`⚠️ 分类关联${operation === 'create' ? '创建' : '更新'}失败，使用手动处理:`, error.message);
      if (operation === 'create') {
        await this._manuallyInsertCategoryRelations(instance.id, categoryIds, transaction);
      } else {
        await this._manuallyUpdateCategoryRelations(instance.id, categoryIds, transaction);
      }
    }
  }

  /**
   * 🔥 处理标签关联的具体逻辑
   * @param {Object} instance 模型实例
   * @param {Array} tagIds 标签ID数组
   * @param {Transaction} transaction 事务对象
   * @param {String} operation 操作类型
   * @private
   */
  async _handleTagRelation(instance, tagIds, transaction, operation) {
    try {
      await instance.setTags(tagIds, { transaction });
      console.log(`✅ 成功${operation === 'create' ? '创建' : '更新'} ${tagIds.length} 个标签关联`);
    } catch (error) {
      console.warn(`⚠️ 标签关联${operation === 'create' ? '创建' : '更新'}失败，使用手动处理:`, error.message);
      if (operation === 'create') {
        await this._manuallyInsertTagRelations(instance.id, tagIds, transaction);
      } else {
        await this._manuallyUpdateTagRelations(instance.id, tagIds, transaction);
      }
    }
  }

  /**
   * 🔥 重写 create 方法以处理关联表数据插入
   * @param {Object} data 创建数据
   * @return {Promise<Object>} 创建结果
   */
  async create(data) {
    await this._ensureConnection();
    const transaction = await this.connection.getSequelize().transaction();

    try {
      // 应用自定义预处理
      const processedData = this._customPreprocessForCreate(data);

      // 创建主记录
      const result = await this.model.create(processedData, { transaction });

      // 🔥 使用通用方法处理关联关系
      await this._handleRelationships(result, processedData, transaction, 'create');

      await transaction.commit();

      // 获取完整数据（包含关联）
      const fullResult = await this.findById(result.id, {
        populate: this._getDefaultPopulate(),
      });

      this._logOperation('create', { data }, fullResult);
      return fullResult;
    } catch (error) {
      await transaction.rollback();
      this._handleError(error, 'create', { data });
    }
  }

  /**
   * 🔥 重写 update 方法以处理关联表数据更新
   * @param {String|Number} id 记录ID
   * @param {Object} data 更新数据
   * @param {Object} [options] 额外选项
   * @param {Boolean} [options.skipValidation=false] 是否跳过字段验证（批量关联更新使用）
   * @return {Promise<Object>} 更新结果
   */
  async update(id, data, options = {}) {
    await this._ensureConnection();
    const transaction = await this.connection.getSequelize().transaction();
    const { skipValidation = false } = options;

    try {
      // 应用自定义预处理
      const processedData = this._customPreprocessForUpdate(data);

      // 🔥 检查是否为软删除操作，如果是则跳过验证
      const isSoftDelete =
        data.draft && Object.keys(data).filter(key => key !== 'draft' && key !== 'updatedAt').length === 0;
      // 批量关联更新（如分类/标签批量更新）时跳过字段验证，避免无关字段阻塞
      const shouldSkipValidation = isSoftDelete || skipValidation;
      const updateOptions = {
        where: { id },
        transaction,
        validate: !shouldSkipValidation, // 软删除或批量关联更新时跳过验证
      };

      if (isSoftDelete) {
        console.log(`🔥 单条软删除操作检测到，跳过字段验证 - ID: ${id}`);
      } else if (skipValidation) {
        console.log(`🔥 批量关联更新检测到，跳过字段验证 - ID: ${id}`);
      }

      // 将关联字段从直接更新中剔除，避免空查询错误
      const relationFields = ['categories', 'tags'];
      const directUpdateData = { ...processedData };
      relationFields.forEach(field => {
        if (field in directUpdateData) {
          delete directUpdateData[field];
        }
      });

      // 如果仅更新关联（无直接字段），补充更新时间以避免空更新
      if (Object.keys(directUpdateData).length === 0) {
        directUpdateData.updatedAt = new Date();
        console.log(`🔥 仅关联字段更新，补充 updatedAt 防止空查询 - ID: ${id}`);
      }

      // 更新主记录
      await this.model.update(directUpdateData, updateOptions);

      // 获取更新后的实例
      const instance = await this.model.findByPk(id, { transaction });
      if (!instance) {
        throw new Error(`Content with id ${id} not found`);
      }

      // 🔥 使用通用方法处理关联关系
      await this._handleRelationships(instance, processedData, transaction, 'update');

      await transaction.commit();

      // 获取更新后的完整数据
      const fullResult = await this.findById(id, {
        populate: this._getDefaultPopulate(),
      });

      this._logOperation('update', { id, data }, fullResult);
      return fullResult;
    } catch (error) {
      await transaction.rollback();
      this._handleError(error, 'update', { id, data });
    }
  }

  /**
   * 🔥 手动插入分类关联表数据（备用方案）
   * @param {Number} contentId 内容ID
   * @param {Array} categoryIds 分类ID数组
   * @param {Transaction} transaction 事务
   * @private
   */
  async _manuallyInsertCategoryRelations(contentId, categoryIds, transaction) {
    const ContentCategoryRelation = this.connection.getModel('ContentCategoryRelation');
    if (!ContentCategoryRelation) {
      console.warn('⚠️ ContentCategoryRelation 模型不存在，跳过关联表插入');
      return;
    }

    const relations = categoryIds.map((categoryId, index) => ({
      content_id: contentId,
      category_id: categoryId,
      relation_type: 'primary',
      sort_order: index,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await ContentCategoryRelation.bulkCreate(relations, {
      transaction,
      ignoreDuplicates: true,
    });
    console.log(`✅ 手动插入 ${relations.length} 个分类关联`);
  }

  /**
   * 🔥 手动插入标签关联表数据（备用方案）
   * @param {Number} contentId 内容ID
   * @param {Array} tagIds 标签ID数组
   * @param {Transaction} transaction 事务
   * @private
   */
  async _manuallyInsertTagRelations(contentId, tagIds, transaction) {
    const ContentTagRelation = this.connection.getModel('ContentTagRelation');
    if (!ContentTagRelation) {
      console.warn('⚠️ ContentTagRelation 模型不存在，跳过关联表插入');
      return;
    }

    const relations = tagIds.map((tagId, index) => ({
      content_id: contentId,
      tag_id: tagId,
      importance: 'medium',
      sort_order: index,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await ContentTagRelation.bulkCreate(relations, {
      transaction,
      ignoreDuplicates: true,
    });
    console.log(`✅ 手动插入 ${relations.length} 个标签关联`);
  }

  /**
   * 🔥 手动更新分类关联表数据（备用方案）
   * @param {Number} contentId 内容ID
   * @param {Array} categoryIds 分类ID数组
   * @param {Transaction} transaction 事务
   * @private
   */
  async _manuallyUpdateCategoryRelations(contentId, categoryIds, transaction) {
    const ContentCategoryRelation = this.connection.getModel('ContentCategoryRelation');
    if (!ContentCategoryRelation) {
      console.warn('⚠️ ContentCategoryRelation 模型不存在，跳过关联表更新');
      return;
    }

    // 删除现有关联
    await ContentCategoryRelation.destroy({
      where: { content_id: contentId },
      transaction,
    });

    // 插入新关联
    if (categoryIds.length > 0) {
      await this._manuallyInsertCategoryRelations(contentId, categoryIds, transaction);
    }
  }

  /**
   * 🔥 手动更新标签关联表数据（备用方案）
   * @param {Number} contentId 内容ID
   * @param {Array} tagIds 标签ID数组
   * @param {Transaction} transaction 事务
   * @private
   */
  async _manuallyUpdateTagRelations(contentId, tagIds, transaction) {
    const ContentTagRelation = this.connection.getModel('ContentTagRelation');
    if (!ContentTagRelation) {
      console.warn('⚠️ ContentTagRelation 模型不存在，跳过关联表更新');
      return;
    }

    // 删除现有关联
    await ContentTagRelation.destroy({
      where: { content_id: contentId },
      transaction,
    });

    // 插入新关联
    if (tagIds.length > 0) {
      await this._manuallyInsertTagRelations(contentId, tagIds, transaction);
    }
  }

  // 业务方法
  async findByAuthor(authorId, options = {}) {
    await this._ensureConnection();
    const filters = { author: { $eq: authorId }, draft: { $ne: '1' }, ...options.filters };
    return await this.find({}, { ...options, filters });
  }

  async findByUAuthor(uAuthorId, options = {}) {
    await this._ensureConnection();
    const filters = { uAuthor: { $eq: uAuthorId }, draft: { $ne: '1' }, ...options.filters };
    return await this.find({}, { ...options, filters });
  }

  async aggregateCounts(key, typeId) {
    await this._ensureConnection();
    try {
      const whereCondition = { state: '2', draft: { [this.Op.ne]: '1' } };

      if (key === 'categories' || key === 'tags') {
        whereCondition[this.Op.and] = [
          this.connection
            .getSequelize()
            .where(
              this.connection
                .getSequelize()
                .fn('JSON_CONTAINS', this.connection.getSequelize().col(key), JSON.stringify(typeId)),
              true
            ),
        ];
      } else {
        whereCondition[key] = typeId;
      }

      const count = await this.model.count({ where: whereCondition });
      this._logOperation('aggregateCounts', { key, typeId }, count);
      return count;
    } catch (error) {
      this._handleError(error, 'aggregateCounts', { key, typeId });
      return 0;
    }
  }

  async getHotTagStats(payload = {}) {
    await this._ensureConnection();
    try {
      const { limit = 20 } = payload;
      const sql = `
        SELECT 
          JSON_UNQUOTE(JSON_EXTRACT(tag_value.value, '$')) as tag_id,
          COUNT(*) as count
        FROM contents c
        CROSS JOIN JSON_TABLE(c.tags, '$[*]' COLUMNS (value JSON PATH '$')) tag_value
        WHERE c.state = '2' AND c.draft != '1' AND JSON_LENGTH(c.tags) > 0
        GROUP BY tag_id ORDER BY count DESC LIMIT ?
      `;

      const result = await this.connection.getSequelize().query(sql, {
        replacements: [limit],
        type: this.connection.getSequelize().QueryTypes.SELECT,
      });

      this._logOperation('getHotTagStats', { payload }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getHotTagStats', { payload });
      return [];
    }
  }

  async inc(id, incData) {
    await this._ensureConnection();
    try {
      const mariadbId = this.transformer.transformQueryForMariaDB({ id }).id;
      const updateFields = [];
      const values = {};

      for (const [field, value] of Object.entries(incData)) {
        updateFields.push(`${field} = ${field} + :${field}`);
        values[field] = value;
      }

      values.id = mariadbId;
      values.updatedAt = new Date();

      const sql = `UPDATE contents SET ${updateFields.join(', ')}, updatedAt = :updatedAt WHERE id = :id`;
      const [result] = await this.connection.getSequelize().query(sql, {
        replacements: values,
        type: this.connection.getSequelize().QueryTypes.UPDATE,
      });

      this._logOperation('inc', { id, incData }, result);
      return { modifiedCount: result };
    } catch (error) {
      this._handleError(error, 'inc', { id, incData });
    }
  }

  /**
   * 🔥 重写 updateMany 方法以处理关联表数据更新
   * @param {Array|String} ids ID数组或单个ID
   * @param {Object} data 更新数据
   * @param {Object} query 额外查询条件
   * @return {Promise<Object>} 更新结果
   */
  async updateMany(ids, data, query = {}) {
    await this._ensureConnection();

    try {
      const idArray = Array.isArray(ids) ? ids : [ids];

      // 🔥 检查是否涉及关联字段更新
      const hasRelationFields = data.categories !== undefined || data.tags !== undefined;

      if (hasRelationFields) {
        console.log(`🔥 检测到关联字段更新，对 ${idArray.length} 个内容逐个处理`);

        let successCount = 0;
        const errors = [];

        // 逐个处理以确保关联表同步
        for (const id of idArray) {
          try {
            // 批量更新分类或标签时，无需对全部字段进行验证
            await this.update(id, data, { skipValidation: true });
            successCount++;
          } catch (error) {
            errors.push({ id, error: error.message });
            console.warn(`⚠️ 更新内容 ${id} 失败:`, error.message);
          }
        }

        this._logOperation(
          'updateMany',
          { ids, data, query },
          {
            successCount,
            totalCount: idArray.length,
            errors,
          }
        );

        return { modifiedCount: successCount, errors };
      }
      // 🔥 普通字段批量更新，使用原有逻辑
      const mariadbIds = idArray.map(id => this.transformer.transformQueryForMariaDB({ id }).id);

      const whereCondition = {
        id: { [this.Op.in]: mariadbIds },
        ...this.transformer.transformQueryForMariaDB(query),
      };

      // 🔥 检查是否包含 MongoDB 操作符（如 $inc）
      const hasMongoOperators = data.$inc || data.$set || data.$unset;
      let updateData;

      if (hasMongoOperators) {
        // 转换 MongoDB 操作符为 MariaDB 语法
        const sequelize = this.connection.getSequelize();
        updateData = this.transformer.transformMongoOperatorsForMariaDB(data, sequelize);
        updateData.updatedAt = new Date();
      } else {
        updateData = { ...data, updatedAt: new Date() };
      }

      // 🔥 检查是否为软删除操作或增量操作，如果是则跳过验证
      const isSoftDelete = data.draft && Object.keys(data).length <= 2; // draft + updatedAt
      const isIncrementOp = data.$inc !== undefined; // 增量操作
      const shouldSkipValidation = isSoftDelete || isIncrementOp;

      const updateOptions = {
        where: whereCondition,
        validate: !shouldSkipValidation, // 软删除或增量操作时跳过验证
      };

      if (isSoftDelete) {
        console.log(`🔥 软删除操作检测到，跳过字段验证 - 更新 ${idArray.length} 条记录`);
      } else if (isIncrementOp) {
        console.log(`🔥 增量操作检测到（$inc），跳过字段验证 - 更新 ${idArray.length} 条记录`);
      }

      const [result] = await this.model.update(updateData, updateOptions);

      this._logOperation('updateMany', { ids, data, query }, result);
      return { modifiedCount: result };
    } catch (error) {
      this._handleError(error, 'updateMany', { ids, data, query });
      return { modifiedCount: 0 };
    }
  }

  /**
   * 🔥 重写 remove 方法以清理关联表数据
   * @param {Array|String} ids ID数组或单个ID
   * @param {String} key 主键字段名
   * @return {Promise<Object>} 删除结果
   */
  async remove(ids, key = 'id') {
    await this._ensureConnection();
    const transaction = await this.connection.getSequelize().transaction();

    try {
      const idArray = Array.isArray(ids) ? ids : [ids];
      console.log(`🔥 删除内容及其关联数据: ${idArray.length} 个记录`);

      // 🔥 清理关联表数据
      await this._cleanupRelations(idArray, transaction);

      // 🔥 删除主表数据
      const result = await this.model.destroy({
        where: { [key]: { [this.Op.in]: idArray } },
        transaction,
      });

      await transaction.commit();

      this._logOperation('remove', { ids, key }, result);
      console.log(`✅ 成功删除 ${result} 个内容记录及其关联数据`);

      return result;
    } catch (error) {
      await transaction.rollback();
      this._handleError(error, 'remove', { ids, key });
      return 0;
    }
  }

  /**
   * 🔥 清理关联表数据
   * @param {Array} contentIds 内容ID数组
   * @param {Transaction} transaction 事务
   * @private
   */
  async _cleanupRelations(contentIds, transaction) {
    try {
      // 清理分类关联
      const ContentCategoryRelation = this.connection.getModel('ContentCategoryRelation');
      if (ContentCategoryRelation) {
        const categoryResult = await ContentCategoryRelation.destroy({
          where: { content_id: { [this.Op.in]: contentIds } },
          transaction,
        });
        console.log(`🧹 清理分类关联: ${categoryResult} 条记录`);
      }

      // 清理标签关联
      const ContentTagRelation = this.connection.getModel('ContentTagRelation');
      if (ContentTagRelation) {
        const tagResult = await ContentTagRelation.destroy({
          where: { content_id: { [this.Op.in]: contentIds } },
          transaction,
        });
        console.log(`🧹 清理标签关联: ${tagResult} 条记录`);
      }
    } catch (error) {
      console.warn('⚠️ 清理关联表数据时出现警告:', error.message);
      // 不抛出错误，允许继续删除主表数据
    }
  }

  async findByState(state, payload = {}, options = {}) {
    const filters = { state: { $eq: state }, draft: { $ne: '1' }, ...options.filters };
    return await this.find(payload, { ...options, filters });
  }

  async findTopContents(payload = {}, options = {}) {
    const filters = {
      isTop: { $eq: 1 },
      state: { $eq: '2' },
      draft: { $ne: '1' },
      ...options.filters,
    };
    const sort = options.sort || this._getDefaultSort();
    return await this.find(payload, { ...options, filters, sort });
  }

  async findRoofContents(payload = {}, options = {}) {
    const filters = {
      roofPlacement: { $eq: '1' },
      state: { $eq: '2' },
      draft: { $ne: '1' },
      ...options.filters,
    };
    const sort = options.sort || this._getDefaultSort();
    return await this.find(payload, { ...options, filters, sort });
  }

  async searchByKeyword(keyword, payload = {}, options = {}) {
    const searchOptions = {
      ...options,
      searchKeys: options.searchKeys || this._getDefaultSearchKeys(),
      filters: { state: { $eq: '2' }, draft: { $ne: '1' }, ...options.filters },
    };
    return await this.find({ ...payload, searchkey: keyword }, searchOptions);
  }

  async getContentStats(filter = {}) {
    await this._ensureConnection();
    try {
      const whereCondition = {
        ...this.transformer.transformQueryForMariaDB(filter),
        draft: { [this.Op.ne]: '1' },
      };

      const stats = await this.model.findAll({
        attributes: [
          'state',
          [this.connection.getSequelize().fn('COUNT', this.connection.getSequelize().col('id')), 'count'],
        ],
        where: whereCondition,
        group: ['state'],
        raw: true,
      });

      const result = { total: 0, draft: 0, pending: 0, published: 0, offline: 0 };
      stats.forEach(stat => {
        const count = parseInt(stat.count, 10);
        result.total += count;
        switch (stat.state) {
          case '0':
            result.draft = count;
            break;
          case '1':
            result.pending = count;
            break;
          case '2':
            result.published = count;
            break;
          case '3':
            result.offline = count;
            break;
        }
      });

      this._logOperation('getContentStats', { filter }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getContentStats', { filter });
      return { total: 0, draft: 0, pending: 0, published: 0, offline: 0 };
    }
  }

  async getAuthorContentStats(authorId, authorType = 'user') {
    const authorField = authorType === 'admin' ? 'author' : 'uAuthor';
    const filter = { [authorField]: authorId };
    const stats = await this.getContentStats(filter);
    stats.authorId = authorId;
    stats.authorType = authorType;
    return stats;
  }

  async getCategoryContentStats(categoryId) {
    const count = await this.aggregateCounts('categories', categoryId);
    return { categoryId, total: count, published: count, draft: 0, pending: 0, offline: 0 };
  }
  /**
   * 🔥 优化查询：通过分类查找内容（支持标准关联和JSON回退）
   * @param {Array} categoryIds 分类ID数组
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 内容列表
   */
  async findByCategories(categoryIds, options = {}) {
    await this._ensureConnection();

    const { useRelations = true, fallbackToJson = true } = options;

    if (useRelations && this.model.associations && this.model.associations.categories) {
      try {
        console.log('🔥 使用标准关联查询分类内容');
        return await this.model.findAll({
          include: [
            {
              model: this.model.sequelize.models.ContentCategory,
              as: 'categories',
              where: { id: { [this.Op.in]: categoryIds } },
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
      console.log('🔥 使用JSON字段查询分类内容');
      return await this.model.findAll({
        where: {
          [this.Op.or]: categoryIds.map(id => this.model.sequelize.literal(`JSON_CONTAINS(categories, '"${id}"')`)),
        },
        ...options.queryOptions,
      });
    }

    return [];
  }

  /**
   * 🔥 优化查询：通过标签查找内容（支持标准关联和JSON回退）
   * @param {Array} tagIds 标签ID数组
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 内容列表
   */
  async findByTags(tagIds, options = {}) {
    await this._ensureConnection();

    const { useRelations = true, fallbackToJson = true } = options;

    if (useRelations && this.model.associations && this.model.associations.tags) {
      try {
        console.log('🔥 使用标准关联查询标签内容');
        return await this.model.findAll({
          include: [
            {
              model: this.model.sequelize.models.ContentTag,
              as: 'tags',
              where: { id: { [this.Op.in]: tagIds } },
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
      console.log('🔥 使用JSON字段查询标签内容');
      return await this.model.findAll({
        where: {
          [this.Op.or]: tagIds.map(id => this.model.sequelize.literal(`JSON_CONTAINS(tags, '"${id}"')`)),
        },
        ...options.queryOptions,
      });
    }

    return [];
  }

  // 🔥 删除重复的 find 方法 - 基类已通过 _transformPopulateForMariaDB 完美处理
  // 基类会自动使用 registerModel 中注册的关联配置转换 populate 到 include
}

module.exports = ContentMariaRepository;
