'use strict';
const xss = require('xss');
const _ = require('lodash');
const shortid = require('shortid');

const { siteFunc } = require('../../utils');
const contentRule = (ctx) => {
  return {
    title: {
      type: 'string',
      required: true,
      min: 2,
      max: 50,
      message: ctx.__('validate_error_field', [ctx.__('label_content_title')]),
    },
    stitle: {
      type: 'string',
      required: true,
      min: 2,
      max: 50,
      message: ctx.__('validate_error_field', [ctx.__('label_content_stitle')]),
    },
    sImg: {
      type: 'string',
      required: true,
      message: ctx.__('validate_error_field', [ctx.__('lc_small_images')]),
    },
    discription: {
      type: 'string',
      required: true,
      min: 3,
      max: 300,
      message: ctx.__('validate_error_field', [ctx.__('label_content_dis')]),
    },
    comments: {
      type: 'string',
      required: true,
      min: 5,
      max: 100000,
      message: ctx.__('validate_inputCorrect', [
        ctx.__('label_content_comments'),
      ]),
    },
  };
};

const renderContentTags = async (ctx, fieldTags) => {
  let newTagArr = [];
  if (!_.isEmpty(fieldTags) && typeof fieldTags === 'object') {
    for (const tagItem of fieldTags) {
      let targetItem;
      if (shortid.isValid(tagItem)) {
        targetItem = await ctx.service.contentTag.item(ctx, {
          query: {
            _id: tagItem,
          },
        });
      }
      if (_.isEmpty(targetItem)) {
        const thisItem = await ctx.service.contentTag.item(ctx, {
          query: {
            name: tagItem,
          },
        });

        if (!_.isEmpty(thisItem)) {
          newTagArr.push(thisItem._id);
        } else {
          const newTag = await ctx.service.contentTag.create({
            name: tagItem,
            comments: tagItem,
          });
          newTagArr.push(newTag._id);
        }
      } else {
        newTagArr.push(tagItem);
      }
    }
  }

  if (_.isEmpty(newTagArr)) {
    newTagArr = fieldTags;
  }
  return newTagArr;
};

const ContentController = {
  async list(ctx, app) {
    try {
      const payload = ctx.query;
      const state = ctx.query.state;
      const uAuthor = ctx.query.uAuthor;
      const categories = ctx.query.categories;
      const draft = ctx.query.draft;

      const queryObj = {};

      if (draft) {
        queryObj.draft = draft;
      } else {
        queryObj.draft = {
          $ne: '1',
        };
      }
      if (state) {
        queryObj.state = state;
      }
      if (uAuthor) {
        queryObj.uAuthor = uAuthor;
      }
      if (categories) {
        queryObj.categories = categories;
      }

      const contentList = await ctx.service.content.find(payload, {
        query: queryObj,
        searchKeys: ['userName', 'title', 'comments', 'discription'],
        populate: [
          {
            path: 'author',
            select: 'userName name logo _id group',
          },
          {
            path: 'uAuthor',
            select: 'userName name logo _id group',
            $match: {
              group: '1',
            },
          },
          {
            path: 'categories',
            select: 'name _id defaultUrl',
          },
          {
            path: 'tags',
            select: 'name _id',
          },
        ],
      });

      ctx.helper.renderSuccess(ctx, {
        data: contentList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async create(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      let targetKeyWords = [];
      if (fields.keywords) {
        if (fields.keywords.indexOf(',') >= 0) {
          targetKeyWords = fields.keywords.split(',');
        } else if (fields.keywords.indexOf('，') >= 0) {
          targetKeyWords = fields.keywords.split('，');
        } else {
          targetKeyWords = fields.keywords;
        }
      }

      const newTagArr = await renderContentTags(ctx, fields.tags);

      const formObj = {
        title: fields.title,
        stitle: fields.stitle || fields.title,
        type: fields.type,
        categories: fields.categories,
        sortPath: fields.sortPath,
        tags: newTagArr,
        keywords: targetKeyWords,
        source: fields.source,
        sImg: fields.sImg,
        sImgType: fields.sImgType,
        cover: fields.cover,
        author: !_.isEmpty(ctx.session.adminUserInfo)
          ? ctx.session.adminUserInfo._id
          : '',
        state: fields.state,
        dismissReason: fields.dismissReason,
        isTop: fields.isTop,
        discription: xss(fields.discription),
        comments: fields.comments,
        simpleComments: xss(fields.simpleComments),
        likeUserIds: [],
        type: fields.type,
      };

      ctx.validate(contentRule(ctx), formObj);

      // 设置显示模式
      const checkInfo = siteFunc.checkContentType(formObj.simpleComments);
      formObj.appShowType = checkInfo.type;
      formObj.imageArr = checkInfo.imgArr;
      formObj.videoArr = checkInfo.videoArr;
      if (checkInfo.type === '3') {
        formObj.videoImg = checkInfo.defaultUrl;
      }
      formObj.simpleComments = siteFunc.renderSimpleContent(
        formObj.simpleComments,
        checkInfo.imgArr,
        checkInfo.videoArr
      );

      // 如果是管理员代发,则指定用户
      if (ctx.session.adminUserInfo && fields.targetUser) {
        formObj.uAuthor = fields.targetUser;
      } else {
        throw new Error(ctx.__('validate_error_params'));
      }

      await ctx.service.content.create(formObj);

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getOne(ctx, app) {
    try {
      const _id = ctx.query.id;

      const targetContent = await ctx.service.content.item(ctx, {
        query: {
          _id,
        },
        populate: [
          {
            path: 'author',
            select: 'userName name logo _id group',
          },
          {
            path: 'uAuthor',
            select: 'userName name logo _id group',
          },
          {
            path: 'categories',
            select: 'name _id defaultUrl',
          },
          {
            path: 'tags',
            select: 'name _id',
          },
        ],
      });

      ctx.helper.renderSuccess(ctx, {
        data: targetContent,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  // 文章推荐
  async updateContentToTop(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      if (!fields._id) {
        throw new Error(ctx.__('validate_error_params'));
      }
      await ctx.service.content.update(ctx, fields._id, {
        isTop: fields.isTop,
      });

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  // 文章置顶
  async roofPlacement(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      await ctx.service.content.update(ctx, fields._id, {
        roofPlacement: fields.roofPlacement,
      });

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  // 给文章分配用户
  async redictContentToUsers(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      let errMsg = '',
        targetIds = fields.ids;
      const targetUser = fields.targetUser;

      if (!shortid.isValid(targetUser)) {
        errMsg = ctx.__('validate_error_params');
      }

      if (errMsg) {
        throw new Error(errMsg);
      }

      await ctx.service.content.updateMany(ctx, targetIds, {
        uAuthor: targetUser,
      });

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async update(ctx, app) {
    try {
      const fields = ctx.request.body || {};

      const newTagArr = await renderContentTags(ctx, fields.tags);

      const formObj = {
        title: fields.title,
        stitle: fields.stitle || fields.title,
        type: fields.type,
        categories: fields.categories,
        sortPath: fields.sortPath,
        tags: newTagArr,
        keywords: fields.keywords ? fields.keywords.split(',') : [],
        source: fields.source,
        sImg: fields.sImg,
        sImgType: fields.sImgType,
        cover: fields.cover,
        author: !_.isEmpty(ctx.session.adminUserInfo)
          ? ctx.session.adminUserInfo._id
          : '',
        state: fields.state,
        dismissReason: fields.dismissReason,
        isTop: fields.isTop || '',
        updateDate: new Date(),
        discription: xss(fields.discription),
        comments: fields.comments,
        simpleComments: xss(fields.simpleComments),
      };

      ctx.validate(contentRule(ctx), formObj);

      // 设置显示模式
      const checkInfo = siteFunc.checkContentType(formObj.simpleComments);
      formObj.appShowType = checkInfo.type;
      formObj.imageArr = checkInfo.imgArr;
      formObj.videoArr = checkInfo.videoArr;

      formObj.simpleComments = siteFunc.renderSimpleContent(
        formObj.simpleComments,
        checkInfo.imgArr,
        checkInfo.videoArr
      );

      if (checkInfo.type === '3') {
        formObj.videoImg = checkInfo.defaultUrl;
      }

      // 如果是管理员代发,则指定用户
      if (ctx.session.adminUserInfo && fields.targetUser) {
        formObj.uAuthor = fields.targetUser;
      } else {
        throw new Error(ctx.__('validate_error_params'));
      }

      await ctx.service.content.update(ctx, fields._id, formObj);

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async updateContentEditor(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      const formObj = {
        targetEditor: fields.targetUser,
      };

      const oldUser = await ctx.service.user.item(ctx, {
        query: {
          _id: fields.targetUser,
        },
      });

      if (_.isEmpty(oldUser)) {
        throw new Error(ctx.__('validate_error_params'));
      }

      const adminUserInfo = ctx.session.adminUserInfo;

      await ctx.service.adminUser.update(ctx, adminUserInfo._id, formObj);

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async moveCate(ctx, app) {
    try {
      const fields = ctx.request.body || {};

      if (!fields.ids || !fields.categories) {
        throw new Error(ctx.__('validate_error_params'));
      }
      const targetIds = fields.ids.split(',');
      for (const contentId of targetIds) {
        await ctx.service.content.update(ctx, contentId, {
          categories: fields.categories,
        });
      }

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async removes(ctx, app) {
    try {
      const targetIds = ctx.query.ids;
      const draft = ctx.query.draft;

      if (!checkCurrentId(targetIds)) {
        throw new Error(ctx.__('validate_error_params'));
      }

      if (draft === '1') {
        await ctx.service.content.safeDelete(ctx, targetIds, {
          draft: '1',
        });
      } else {
        await ctx.service.message.removes(ctx, targetIds, 'contentId');
        await ctx.service.content.removes(ctx, targetIds);
      }

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async updateContents(ctx, app) {
    try {
      const fields = ctx.request.body || {};

      const targetIds = fields.ids;
      const updates = fields.updates;

      if (!checkCurrentId(targetIds)) {
        throw new Error(ctx.__('validate_error_params'));
      }

      await ctx.service.content.updateMany(ctx, targetIds, updates);

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = ContentController;
