'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const data = await this.service.test.get(123);
    this.ctx.body = data.name;
  }
}

module.exports = HomeController;
