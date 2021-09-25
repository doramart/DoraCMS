'use strict';
const Controller = require('egg').Controller;
const _ = require('lodash');
const shortid = require('shortid');

class UserController extends Controller {
  async getDataForUserLogin() {
    const ctx = this.ctx;
    if (ctx.session.user) {
      ctx.redirect('/');
    } else {
      ctx.title = '用户登录';
      ctx.tempPage = 'users/userLogin.html';
      await ctx.getPageData();
    }
  }

  async getDataForUserReg() {
    const ctx = this.ctx;
    if (ctx.session.user) {
      ctx.redirect('/');
    } else {
      ctx.title = '用户注册';
      ctx.tempPage = 'users/userReg.html';
      await ctx.getPageData();
    }
  }

  async getDataForResetPsdPage() {
    const ctx = this.ctx;
    ctx.tempPage = 'users/userConfirmEmail.html';
    await ctx.getPageData();
  }

  async getDataForUserIndex() {
    const ctx = this.ctx;
    ctx.tempPage = 'users/userCenter.html';
    await ctx.getPageData();
  }

  async getDataForUserCenter() {
    const ctx = this.ctx;
    ctx.tempPage = 'users/userContents.html';
    await ctx.getPageData();
  }

  async getDataForJoinComments() {
    const ctx = this.ctx;
    ctx.tempPage = 'users/joinComments.html';
    await ctx.getPageData();
  }

  async getDataForUserNotify() {
    const ctx = this.ctx;
    ctx.tempPage = 'users/notify.html';
    await ctx.getPageData();
  }

  async getDataForUserAddContent() {
    const ctx = this.ctx;
    ctx.tempPage = 'users/userAddContent.html';
    await ctx.getPageData();
  }

  async getDataForUserInfo() {
    const ctx = this.ctx;
    ctx.tempPage = 'users/personInfo.html';
    await ctx.getPageData();
  }

  async getDataForSetUserPwd() {
    const ctx = this.ctx;
    ctx.tempPage = 'users/userSetPsd.html';
    await ctx.getPageData();
  }

  async getDataForEditContent() {
    const ctx = this.ctx;
    const contentId = ctx.params.id;
    if (!shortid.isValid(contentId)) {
      ctx.redirect('/users/userCenter');
    } else {
      const contentInfo = await ctx.helper.reqJsonData('content/getContent', {
        id: contentId,
        userId: ctx.session.user._id,
        token: ctx.session.user.token,
      });
      if (!_.isEmpty(contentInfo)) {
        ctx.tempPage = 'users/userAddContent.html';
        ctx.pageType = 'editContent';
        ctx.title = '编辑创作';
        ctx.contentId = contentId;
        await ctx.getPageData();
      } else {
        ctx.redirect('/users/userCenter');
      }
    }
  }

  async getDataForUserReply() {
    const ctx = this.ctx;
    ctx.tempPage = 'users/userReplies.html';
    ctx.pageType = 'replies';
    await ctx.getPageData();
  }

  async getDataForUserNotice() {
    const ctx = this.ctx;
    ctx.tempPage = 'users/userNotice.html';
    ctx.pageType = 'notifies';
    await ctx.getPageData();
  }
}

module.exports = UserController;
