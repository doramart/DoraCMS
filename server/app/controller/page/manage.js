'use strict';
const Controller = require('egg').Controller;
// const _ = require('lodash');
// const shortid = require('shortid');

class AdminCenterController extends Controller {
  async getDataForAdminCenterIndex() {
    const ctx = this.ctx;
    ctx.tempPage = 'admin-center/index.html';
    await ctx.render('admin-center/index.html', {});
  }
}

module.exports = AdminCenterController;
