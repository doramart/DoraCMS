'use strict';
const Controller = require('egg').Controller;
// const _ = require('lodash');
// const shortid = require('shortid');

class UserController extends Controller {
  async getDataForUserIndex() {
    const ctx = this.ctx;
    ctx.tempPage = 'user-center/index.html';
    await ctx.render('user-center/index.html', {});
  }
}

module.exports = UserController;
