/**
 * 优化后的 Content API Controller
 * 🔥 基于Menu模块重构经验，优化参数规范化和异常处理
 * ✅ 移除重复的try-catch，使用统一异常处理中间件
 * ✅ 标准化查询参数格式
 * ✅ 业务验证异常化处理
 */
'use strict';

const xss = require('xss');
const _ = require('lodash');
const { siteFunc, validatorUtil } = require('../../utils');
const validator = require('validator');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const awaitStreamReady = require('await-stream-ready').write;
const sendToWormhole = require('stream-wormhole');
const mammoth = require('mammoth');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');

const ContentController = {
  /**
   * 检查Content表单数据
   * @param {Context} ctx 上下文
   * @param {Object} fields 表单字段
   * @throws {ValidationError} 验证失败时抛出异常
   */
  checkContentFormData(ctx, fields) {
    if (fields.id && !ctx.validateId(fields.id)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    if (!validatorUtil.isRegularCharacter(fields.title)) {
      throw RepositoryExceptions.content.titleRequired();
    }
    if (!validator.isLength(fields.title, 2, 50)) {
      throw RepositoryExceptions.content.titleTooLong(50);
    }
    if (fields.stitle && !validator.isLength(fields.stitle, 2, 50)) {
      throw RepositoryExceptions.create.validation(
        ctx.__('validation.rangelength', [ctx.__('content.fields.stitle'), 2, 50])
      );
    }
    if (!fields.tags) {
      throw RepositoryExceptions.content.tagsRequired();
    }
    if (!fields.categories) {
      throw RepositoryExceptions.content.categoriesRequired();
    }
    if (!fields.sImg) {
      throw RepositoryExceptions.create.validation(
        ctx.__('validation.selectNull', [ctx.__('content.fields.thumbnail')])
      );
    }
    if (!validator.isLength(fields.discription, 5, 300)) {
      throw RepositoryExceptions.content.descriptionTooLong(300);
    }
    if (fields.comments && !validator.isLength(fields.comments, 5, 100000)) {
      throw RepositoryExceptions.content.contentTooLong(100000);
    }
  },

  /**
   * 🔥 优化版：获取启用的分类列表 - 使用TemplateService缓存
   * @param {Context} ctx 上下文
   * @param {Boolean} isSingerPage 是否是单页面
   * @return {Promise<Array>} 分类ID列表
   */
  async getEnableCateList(ctx, isSingerPage) {
    // 🚀 使用TemplateService的缓存分类树方法
    const categoryTree = await ctx.service.templateService.fetchContent('categoryTree', {
      type: isSingerPage ? '2' : '1',
      enable: true,
    });

    // 递归提取所有启用的分类ID
    const extractCategoryIds = categories => {
      const ids = [];
      categories.forEach(category => {
        if (category.enable) {
          ids.push(category.id);
          if (category.children && category.children.length > 0) {
            ids.push(...extractCategoryIds(category.children));
          }
        }
      });
      return ids;
    };

    return extractCategoryIds(categoryTree || []);
  },

  /**
   * 🔥 优化版：根据类别id获取文档数量 - 使用TemplateService
   * @param ctx
   */
  async getContentCountsByCateId(ctx) {
    try {
      const typeId = ctx.query.typeId;

      if (!ctx.validateId(typeId)) {
        throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
      }

      // 🚀 使用TemplateService获取分类统计信息
      const categoryStats = await ctx.service.templateService.fetchContent('categoryStats', {
        typeId,
        ...ctx.query,
      });

      ctx.helper.renderSuccess(ctx, {
        data: categoryStats,
      });
    } catch (error) {
      ctx.logger.error('Get content counts by category id error:', error);
      ctx.helper.renderFail(ctx, {
        data: error.message,
      });
    }
  },

  /**
   * 🔥 优化版：获取热门标签Id列表 - 使用TemplateService
   * @param ctx
   */
  async getHotTagIds(ctx) {
    try {
      // 🚀 直接使用TemplateService的优化方法
      const hotTags = await ctx.service.templateService.fetchContent('hotTags', {
        pageSize: ctx.query.pageSize || 10,
        ...ctx.query,
      });

      ctx.helper.renderSuccess(ctx, {
        data: hotTags,
      });
    } catch (error) {
      ctx.logger.error('Get hot tag ids error:', error);
      ctx.helper.renderFail(ctx, {
        data: error.message,
      });
    }
  },

  /**
   * 🔥 优化版：内容列表查询 - 使用Service层重构
   * @param ctx
   */
  async list(ctx) {
    try {
      const userInfo = ctx.session.user || {};

      // 参数验证
      const { sortby, listState } = ctx.query;
      if (sortby && !['1'].includes(sortby)) {
        throw new Error('Invalid sortby parameter');
      }
      if (listState && !['0', '1', '2', 'all'].includes(listState)) {
        throw new Error('Invalid listState parameter');
      }

      // 🚀 调用Service层的统一方法
      const contentList = await ctx.service.content.getContentList(ctx.query, userInfo);

      ctx.helper.renderSuccess(ctx, {
        data: contentList,
      });
    } catch (error) {
      ctx.logger.error('Content list error:', error);
      ctx.helper.renderFail(ctx, {
        data: error.message,
      });
    }
  },

  /**
   * 🔥 优化版：获取置顶推荐内容
   * @param ctx
   */
  async getTopIndexContents(ctx) {
    const payload = ctx.query;
    const userInfo = ctx.session.user || {};

    // 基础查询条件
    const baseFilters = {
      state: { $eq: '2' },
      isTop: { $eq: 1 },
      uAuthor: { $ne: null },
    };

    const sort = [{ field: 'roofPlacement', order: 'desc' }];
    const fields = getContentListFields().split(' ').filter(Boolean);

    let recContents = [];

    if (!_.isEmpty(userInfo) && !_.isEmpty(userInfo.watchTags) && userInfo.watchTags.length > 0) {
      // 基于用户关注标签的推荐
      const tagFilters = {
        ...baseFilters,
        tags: { $in: userInfo.watchTags },
      };

      recContents = await ctx.service.content.find(payload, {
        filters: tagFilters,
        fields,
        sort,
      });

      const recContentsNum = await ctx.service.content.count(tagFilters);

      if (recContentsNum <= payload.current * payload.pageSize) {
        // 如果推荐内容不足，补充普通内容
        const leftSize = payload.current * payload.pageSize - recContentsNum;
        if (leftSize > 0) {
          const leftFilters = {
            ...baseFilters,
            tags: { $nin: userInfo.watchTags },
          };

          const leftContents = await ctx.service.content.find(
            { current: 1, pageSize: leftSize },
            { filters: leftFilters, fields, sort }
          );

          recContents = _.concat(recContents, leftContents);
        }
      }

      recContents.docs = await ctx.service.content.renderContentListOptimized(userInfo.id, recContents.docs);
    } else {
      // 普通推荐内容
      const contents = await ctx.service.content.find(payload, {
        filters: baseFilters,
        fields,
        sort,
      });

      contents.docs = await ctx.service.content.renderContentListOptimized(userInfo.id, contents.docs);
      recContents = contents;
    }

    ctx.helper.renderSuccess(ctx, {
      data: recContents,
    });
  },

  /**
   * 🔥 优化版：获取随机内容 - 使用TemplateService
   * @param ctx
   */
  async getRadomContents(ctx) {
    try {
      // 🚀 直接使用TemplateService的优化方法
      const randomArticles = await ctx.service.templateService.fetchContent('random', {
        pageSize: ctx.query.pageSize || 5,
        typeId: ctx.query.typeId,
        ...ctx.query,
      });

      ctx.helper.renderSuccess(ctx, {
        data: randomArticles,
      });
    } catch (error) {
      ctx.logger.error('Get random contents error:', error);
      ctx.helper.renderFail(ctx, {
        data: error.message,
      });
    }
  },

  /**
   * 🔥 优化版：获取单个内容详情
   * @param ctx
   * @description 不需要传 userId，自动判断：
   * - 如果是自己的文章，可以查看任何状态
   * - 如果是别人的文章，只能查看已发布（state=2）的文章
   */
  async getOneContent(ctx) {
    const targetId = ctx.query.id;

    if (!ctx.validateId(targetId)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    const userInfo = ctx.session.user || {};

    // 先查询文章（不限制状态）
    const targetContent = await ctx.service.content.findOne(
      { id: { $eq: targetId } },
      {
        fields: getContentListFields().split(' ').filter(Boolean),
      }
    );

    if (!targetContent) {
      throw RepositoryExceptions.content.notFound(targetId);
    }

    // 判断是否是自己的文章
    const isOwnArticle = !_.isEmpty(userInfo) && targetContent.uAuthor?.id === userInfo.id;

    // 如果不是自己的文章，只能查看已发布的文章
    if (!isOwnArticle && targetContent.state !== '2') {
      throw RepositoryExceptions.content.notFound(targetId);
    }

    // 增加点击量
    await ctx.service.content.inc(targetId, {
      clickNum: 1,
    });

    let renderContent = [targetContent];
    renderContent = await ctx.service.content.renderContentListOptimized(userInfo.id, renderContent);

    ctx.helper.renderSuccess(ctx, {
      data: renderContent[0],
    });
  },

  /**
   * 🔥 优化版：获取相邻内容 - 使用TemplateService
   * @param ctx
   */
  async getNearbyContent(ctx) {
    try {
      const contentId = ctx.query.id;

      if (!contentId || !ctx.validateId(contentId)) {
        throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
      }

      // 🚀 直接使用TemplateService的优化方法
      const nearbyContent = await ctx.service.templateService.fetchContent('nearby', {
        id: contentId,
        pageSize: ctx.query.pageSize || 2,
        ...ctx.query,
      });

      ctx.helper.renderSuccess(ctx, {
        data: nearbyContent,
      });
    } catch (error) {
      ctx.logger.error('Get nearby content error:', error);
      ctx.helper.renderFail(ctx, {
        data: error.message,
      });
    }
  },

  /**
   * 🔥 新增：获取上一篇和下一篇文章 - 使用TemplateService
   * @param ctx
   */
  async getPrevNextPosts(ctx) {
    try {
      const contentId = ctx.query.id;

      if (!contentId || !ctx.validateId(contentId)) {
        throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
      }

      // 🚀 使用TemplateService获取上下篇文章
      const prevNextPosts = await ctx.service.templateService.fetchContent('nearpost', {
        id: contentId,
        typeId: ctx.query.typeId, // 可选：指定分类ID
        ...ctx.query,
      });

      ctx.helper.renderSuccess(ctx, {
        data: prevNextPosts,
      });
    } catch (error) {
      ctx.logger.error('Get prev next posts error:', error);
      ctx.helper.renderFail(ctx, {
        data: error.message,
      });
    }
  },

  /**
   * 🔥 优化版：获取我的收藏内容
   * @param ctx
   */
  async getMyFavoriteContents(ctx) {
    const payload = ctx.query;
    const userInfo = ctx.session.user;

    if (!userInfo) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const targetUser = await ctx.service.user.findOne({
      id: { $eq: userInfo.id },
    });

    const favoriteContentsData = await ctx.service.content.find(payload, {
      filters: {
        state: { $eq: '2' },
        id: { $in: targetUser.favorites },
      },
      searchKeys: ['name'],
      fields: getContentListFields().split(' ').filter(Boolean),
    });

    favoriteContentsData.docs = await ctx.service.content.renderContentListOptimized(
      userInfo.id,
      favoriteContentsData.docs
    );

    ctx.helper.renderSuccess(ctx, {
      data: favoriteContentsData,
    });
  },

  /**
   * 🔥 优化版：添加内容 - 统一异常处理
   * @param ctx
   */
  async addContent(ctx) {
    const fields = ctx.request.body;

    // 🔥 业务验证 - 自动抛出异常
    ContentController.checkContentFormData(ctx, fields);

    let targetKeyWords = [];
    if (fields.keywords) {
      if (fields.keywords.indexOf(',') >= 0) {
        targetKeyWords = fields.keywords.split(',');
      } else if (fields.keywords.indexOf('，') >= 0) {
        targetKeyWords = fields.keywords.split('，');
      }
    }

    const contentFormObj = {
      title: fields.title,
      stitle: fields.stitle,
      type: fields.type,
      categories: fields.categories,
      sortPath: fields.sortPath,
      tags: fields.tags,
      keywords: targetKeyWords,
      sImg: fields.sImg,
      // state 字段将在后面根据业务逻辑设置，不直接使用前端传值
      dismissReason: fields.dismissReason,
      isTop: fields.isTop,
      discription: xss(fields.discription),
      comments: fields.comments,
      simpleComments: xss(fields.simpleComments),
      likeUserIds: [],
    };

    // 设置显示模式
    const checkInfo = siteFunc.checkContentType(contentFormObj.simpleComments);
    contentFormObj.appShowType = checkInfo.type;
    contentFormObj.imageArr = checkInfo.imgArr;
    contentFormObj.videoArr = checkInfo.videoArr;
    if (checkInfo.type === '3') {
      contentFormObj.videoImg = checkInfo.defaultUrl;
    }

    contentFormObj.simpleComments = siteFunc.renderSimpleContent(
      contentFormObj.simpleComments,
      checkInfo.imgArr,
      checkInfo.videoArr
    );

    // 🔥 检查用户发布限制
    const rangeTime = getDateStr(-1);
    const hadAddContentsNum = await ctx.service.content.count({
      uAuthor: { $eq: ctx.session.user.id },
      createdAt: {
        $gte: new Date(rangeTime.startTime),
        $lte: new Date(rangeTime.endTime),
      },
    });

    if (hadAddContentsNum > 30) {
      throw RepositoryExceptions.content.exceedDailyLimit(30, hadAddContentsNum);
    }

    contentFormObj.comments = xss(fields.comments);
    contentFormObj.stitle = contentFormObj.title;
    contentFormObj.uAuthor = ctx.session.user.id;

    // 🔥 服务端强制控制：普通用户发布的内容必须待审核（不依赖前端传参）
    if (fields.draft === '1') {
      contentFormObj.state = '0'; // 草稿
    } else {
      contentFormObj.state = '1'; // 待审核（普通用户无法直接发布）
    }
    contentFormObj.author = '';

    const newContent = await ctx.service.content.create(contentFormObj);

    ctx.helper.renderSuccess(ctx, {
      data: {
        id: newContent.id,
      },
    });
  },

  /**
   * 🔥 优化版：更新内容 - 统一异常处理
   * @param ctx
   */
  async updateContent(ctx) {
    const fields = ctx.request.body;

    // 🔥 业务验证 - 自动抛出异常
    ContentController.checkContentFormData(ctx, fields);

    const targetContent = await ctx.service.content.findOne({
      id: { $eq: fields.id },
      uAuthor: { $eq: ctx.session.user.id },
    });

    if (_.isEmpty(targetContent)) {
      throw RepositoryExceptions.content.notOwner(fields.id, ctx.session.user.id);
    }

    const contentObj = {
      title: fields.title,
      stitle: fields.stitle || fields.title,
      type: fields.type,
      categories: fields.categories,
      sortPath: fields.sortPath,
      tags: fields.tags,
      keywords: fields.keywords ? fields.keywords.split(',') : [],
      sImg: fields.sImg,
      author: !_.isEmpty(ctx.session.adminUserInfo) ? ctx.session.adminUserInfo.id : '',
      // state 字段将在后面根据业务逻辑设置，不直接使用前端传值
      dismissReason: fields.dismissReason,
      isTop: fields.isTop || '',
      discription: xss(fields.discription),
      comments: fields.comments,
      simpleComments: xss(fields.simpleComments),
    };

    // 设置显示模式
    const checkInfo = siteFunc.checkContentType(contentObj.simpleComments);
    contentObj.appShowType = checkInfo.type;
    contentObj.imageArr = checkInfo.imgArr;
    contentObj.videoArr = checkInfo.videoArr;

    contentObj.simpleComments = siteFunc.renderSimpleContent(
      contentObj.simpleComments,
      checkInfo.imgArr,
      checkInfo.videoArr
    );

    if (checkInfo.type === '3') {
      contentObj.videoImg = checkInfo.defaultUrl;
    }

    contentObj.comments = xss(fields.comments);
    contentObj.stitle = contentObj.title;
    contentObj.uAuthor = ctx.session.user.id;

    // 🔥 服务端强制控制：普通用户更新内容后必须重新审核（不依赖前端传参）
    if (fields.draft === '1') {
      contentObj.state = '0'; // 草稿
    } else {
      contentObj.state = '1'; // 待审核（普通用户无法直接发布）
    }
    contentObj.author = '';
    contentObj.updatedAt = new Date();

    await ctx.service.content.update(fields.id, contentObj);

    ctx.helper.renderSuccess(ctx);
  },

  // 其他方法保持原有逻辑...
  /**
   * 🔥 优化版：处理Word文档上传并转换为HTML
   * @param ctx
   */
  async getWordHtmlContent(ctx) {
    // 获取文件流
    const stream = await ctx.getFileStream();

    // 上传基础目录
    const uploadBasePath = process.cwd() + '/app/public/upload';
    const dayStr = moment().format('YYYYMMDD');

    if (!fs.existsSync(uploadBasePath)) {
      fs.mkdirSync(uploadBasePath);
    }

    // 保存路径
    let savePath = path.join(uploadBasePath, 'file');
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath);
    }

    savePath = path.join(uploadBasePath, 'file', dayStr);
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath);
    }

    // 生成文件名
    let basename = path.basename(stream.filename);
    basename = basename.substring(0, basename.lastIndexOf('.') - 1);

    const filename =
      basename + '_' + Date.now() + '_' + Number.parseInt(Math.random() * 10000) + path.extname(stream.filename);

    // 生成写入路径
    const target = path.join(savePath, filename);

    // 写入流
    const writeStream = fs.createWriteStream(target);

    try {
      // 写入文件
      await awaitStreamReady(stream.pipe(writeStream));

      savePath = path.join(uploadBasePath, 'images');
      if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath);
      }

      savePath = path.join(uploadBasePath, 'images', dayStr);
      if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath);
      }

      const options = {
        convertImage: mammoth.images.imgElement(function (image) {
          let fileType = image.contentType.toLowerCase();
          fileType = fileType.substring(fileType.indexOf('/') + 1);

          const imageName = Date.now() + '' + Number.parseInt(Math.random() * 10000) + '.' + fileType;
          const imageFullName = path.join(savePath, imageName);

          return image.read('base64').then(async function (imageBuffer) {
            const dataBuffer = new Buffer(imageBuffer, 'base64');
            fs.writeFileSync(imageFullName, dataBuffer, 'binary');
            const resultPath = `${this.app.config.static.prefix}/upload/images/${dayStr}/${imageName}`;
            const uploadResult = await ctx.helper.reqJsonData(
              'upload/filePath',
              {
                imgPath: resultPath,
                localImgPath: imageFullName,
                filename: imageName,
              },
              'post'
            );
            return {
              src: uploadResult.path,
            };
          });
        }),
      };

      const result = await mammoth.convertToHtml(
        {
          path: target,
        },
        options
      );

      const html = result.value;

      ctx.helper.renderSuccess(ctx, {
        data: html,
      });
    } catch (err) {
      // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
      await sendToWormhole(stream);
      throw err;
    }
  },

  /**
   * 🔥 优化版：上传base64合成后的背景图
   * @param ctx
   */
  async uploadPreviewImgByBase64(ctx) {
    const fields = ctx.request.body || {};

    if (!fields.base64) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    const uploadBasePath = process.cwd() + '/app/public/upload';
    const dayStr = moment().format('YYYYMMDD');

    let savePath = path.join(uploadBasePath, 'images');
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath);
    }

    savePath = path.join(uploadBasePath, 'images', dayStr);
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath);
    }

    const imageName = Date.now() + '' + Number.parseInt(Math.random() * 10000) + '.png';
    const imageFullName = path.join(savePath, imageName);

    const dataBuffer = new Buffer(fields.base64, 'base64');

    fs.writeFileSync(imageFullName, dataBuffer, 'binary');
    const resultPath = `${this.app.config.static.prefix}/upload/images/${dayStr}/${imageName}`;
    const uploadResult = await ctx.helper.reqJsonData(
      'upload/filePath',
      {
        imgPath: resultPath,
        localImgPath: imageFullName,
        filename: imageName,
      },
      'post'
    );

    ctx.helper.renderSuccess(ctx, {
      data: uploadResult.path,
    });
  },

  /**
   * 🔥 新增：RESTful - 点赞/取消点赞内容
   * POST /api/content/:id/like
   * @param ctx
   */
  async likeContent(ctx) {
    const contentId = ctx.params.id;
    const action = ctx.query.action || 'like'; // like/unlike
    
    if (!ctx.validateId(contentId)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }
    
    if (!['like', 'unlike'].includes(action)) {
      throw RepositoryExceptions.business.invalidParams('无效的操作类型，仅支持 like 或 unlike');
    }
    
    // 🔥 检查用户登录状态
    const userInfo = ctx.session.user;
    if (!userInfo) {
      throw RepositoryExceptions.auth.loginRequired();
    }
    
    const userId = userInfo.id;
    
    // 🔥 验证内容是否存在且已发布
    const targetContent = await ctx.service.content.findOne({
      id: { $eq: contentId },
      state: { $eq: '2' },
    });
    
    if (!targetContent) {
      throw RepositoryExceptions.content.notFound(contentId);
    }
    
    // 🔥 不能点赞自己的文章
    if (targetContent.uAuthor === userId) {
      throw RepositoryExceptions.business.operationNotAllowed(ctx.__('user.action.tips.praiseSelf'));
    }
    
    // 🔥 执行点赞/取消点赞操作
    let result;
    if (action === 'like') {
      result = await ctx.service.contentInteraction.praiseContent(contentId, userId);
      
      // 发送提醒消息
      siteFunc.addSiteMessage('4', userInfo, targetContent.uAuthor, contentId, {
        targetMediaType: '0',
      });
    } else {
      result = await ctx.service.contentInteraction.unpraiseContent(contentId, userId);
    }
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    ctx.helper.renderSuccess(ctx, {
      data: {
        action,
        contentId,
      },
      message: ctx.__('api.response.success', [
        action === 'like' ? ctx.__('user.action.types.thumbsUp') : '取消点赞'
      ]),
    });
  },

  /**
   * 🔥 新增：RESTful - 收藏/取消收藏内容
   * POST /api/content/:id/favorite
   * @param ctx
   */
  async favoriteContent(ctx) {
    const contentId = ctx.params.id;
    const action = ctx.query.action || 'add'; // add/remove
    
    if (!ctx.validateId(contentId)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }
    
    if (!['add', 'remove'].includes(action)) {
      throw RepositoryExceptions.business.invalidParams('无效的操作类型，仅支持 add 或 remove');
    }
    
    // 🔥 检查用户登录状态
    const userInfo = ctx.session.user;
    if (!userInfo) {
      throw RepositoryExceptions.auth.loginRequired();
    }
    
    const userId = userInfo.id;
    
    // 🔥 验证内容是否存在且已发布
    const targetContent = await ctx.service.content.findOne({
      id: { $eq: contentId },
      state: { $eq: '2' },
    });
    
    if (!targetContent) {
      throw RepositoryExceptions.content.notFound(contentId);
    }
    
    // 🔥 执行收藏/取消收藏操作
    let result;
    if (action === 'add') {
      result = await ctx.service.contentInteraction.favoriteContent(contentId, userId);
    } else {
      result = await ctx.service.contentInteraction.unfavoriteContent(contentId, userId);
    }
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    ctx.helper.renderSuccess(ctx, {
      data: {
        action,
        contentId,
      },
      message: ctx.__('api.response.success', [
        action === 'add' ? ctx.__('user.action.types.favorite') : '取消收藏'
      ]),
    });
  },

  /**
   * 🔥 优化版：随机获取图片
   * @param ctx
   */
  async getRandomContentImg(ctx) {
    const payload = ctx.query;
    const pageSize = ctx.query.pageSize || 1;

    // 只查询可见分类的文章
    const ableCateList = await ContentController.getEnableCateList(ctx, false);

    const filters = {
      type: { $eq: '1' },
      state: { $eq: '2' },
      categories: { $in: ableCateList },
    };

    const totalContents = await ctx.service.content.count(filters);
    const randomArticles = await ctx.service.content.find(
      _.assign(payload, {
        isPaging: '0',
        pageSize,
        skip: Math.floor(totalContents * Math.random()),
      }),
      {
        filters,
        fields: ['sImg'],
      }
    );

    const sImgArr = [];

    for (const articleItem of randomArticles) {
      if (articleItem.sImg) {
        sImgArr.push(articleItem.sImg);
      }
    }

    ctx.helper.renderSuccess(ctx, {
      data: sImgArr,
    });
  },
};

module.exports = ContentController;
