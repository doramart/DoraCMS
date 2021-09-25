'use strict';
const Controller = require('egg').Controller;
const _ = require('lodash');
const shortid = require('shortid');
const pkg = require('@root/package.json');
const validator = require('validator');
const captcha = require('trek-captcha');
const path = require('path');
const fs = require('fs');
const qr = require('qr-image');
const moment = require('moment');

class HomeController extends Controller {
  // 获取页面基础信息
  async getSiteInfo(ctx, appConfig) {
    const configs = await ctx.helper.reqJsonData('systemConfig/getConfig');
    const {
      siteName,
      siteDiscription,
      siteKeywords,
      siteAltKeywords,
      ogTitle,
      siteLogo,
    } = configs || [];

    const { title, des, keywords } = ctx.params;
    const pageTitle = title ? title + ' | ' + siteName : siteName;
    const discription = des ? des : siteDiscription;
    const key = keywords ? keywords : siteKeywords;
    const altkey = siteAltKeywords || '';
    return {
      title: pageTitle,
      siteLogo,
      ogTitle,
      discription,
      key,
      altkey,
      configs: configs || [],
      version: pkg.version,
      lang: ctx.session.locale,
      router: ctx.originalUrl.split('/')[1],
    };
  }

  async getImgCode(ctx, app) {
    const { token, buffer } = await captcha();
    ctx.session.imageCode = token;
    ctx.set('Content-Type', 'image/png');
    ctx.status = 200;
    ctx.body = buffer;
  }

  async createQRCode(ctx, app) {
    const text = ctx.request.query.text || '';
    if (text) {
      const img = qr.image(text, {
        size: 10,
      });
      ctx.set('Content-Type', 'image/png');
      ctx.status = 200;
      ctx.body = img;
    } else {
      throw new Error(ctx.__('validate_error_params'));
    }
  }

  async getRobotsPage(ctx) {
    const stream = fs.readFileSync(
      path.join(__dirname, '../../../robots.txt'),
      'utf-8'
    );
    ctx.body = stream;
  }

  async getSiteMapPage() {
    // 获取站点配置
    const configs = await this.ctx.helper.reqJsonData('systemConfig/getConfig');
    const root_path = configs.siteDomain;
    const priority = 0.8;
    const freq = 'weekly';
    const lastMod = moment().format('YYYY-MM-DD');
    let xml =
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    xml += '<url>';
    xml += '<loc>' + root_path + '</loc>';
    xml += '<changefreq>daily</changefreq>';
    xml += '<lastmod>' + lastMod + '</lastmod>';
    xml += '<priority>' + 1 + '</priority>';
    xml += '</url>';

    // 类别地图
    const allCategories = await this.ctx.helper.reqJsonData(
      'contentCategory/getList'
    );
    allCategories.forEach(function (cate) {
      xml += '<url>';
      xml += '<loc>' + root_path + cate.url + '</loc>';
      xml += '<changefreq>weekly</changefreq>';
      xml += '<lastmod>' + lastMod + '</lastmod>';
      xml += '<priority>0.8</priority>';
      xml += '</url>';
    });

    // 文档地图
    const allContents = await this.ctx.helper.reqJsonData('content/getList', {
      isPaging: '0',
    });
    allContents.forEach(function (post) {
      xml += '<url>';
      xml += '<loc>' + root_path + post.url + '</loc>';
      xml += '<changefreq>weekly</changefreq>';
      xml += '<lastmod>' + lastMod + '</lastmod>';
      xml += '<priority>0.5</priority>';
      xml += '</url>';
    });
    xml += '</urlset>';
    this.ctx.set('Content-Type', 'application/xml');
    this.ctx.body = xml;
  }

  async getDataForIndexPage() {
    const ctx = this.ctx;
    ctx.query.current = ctx.params.current;
    ctx.tempPage = 'index.html';
    ctx.pageType = 'index';
    // console.log('-ctx.getSiteInfo();--', await ctx.getSiteInfo())
    await ctx.getPageData();
  }

  async getDataForCatePage() {
    const ctx = this.ctx;
    ctx.pageType = 'cate';
    const typeId = ctx.params.typeId;
    const current = ctx.params.current;
    if (typeId) {
      if (!shortid.isValid(typeId)) {
        ctx.redirect('/');
      } else {
        if (current) {
          if (validator.isNumeric(current)) {
            await ctx.getPageData();
          } else {
            ctx.redirect('/');
          }
        } else {
          await ctx.getPageData();
        }
      }
    } else {
      ctx.redirect('/');
    }
  }

  async getDataForSearchPage() {
    const ctx = this.ctx;
    ctx.pageType = 'search';
    const searchkey = ctx.params.searchkey;
    const current = ctx.params.current;
    if (searchkey) {
      if (current) {
        if (validator.isNumeric(current)) {
          await ctx.getPageData();
        } else {
          ctx.redirect('/');
        }
      } else {
        await ctx.getPageData();
      }
    } else {
      ctx.redirect('/');
    }
  }

  async getDataForTagPage() {
    const ctx = this.ctx;
    ctx.pageType = 'tag';
    const tagName = ctx.params.tagName;
    const current = ctx.params.current;
    if (tagName) {
      if (current) {
        if (validator.isNumeric(current)) {
          await ctx.getPageData();
        } else {
          ctx.redirect('/');
        }
      } else {
        await ctx.getPageData();
      }
    } else {
      ctx.redirect('/');
    }
  }

  async getDataForAuthorPage() {
    const ctx = this.ctx;
    ctx.pageType = 'author';
    ctx.tempPage = 'author.html';
    const userId = ctx.params.userId;
    const current = ctx.params.current;
    if (userId) {
      if (!shortid.isValid(userId)) {
        ctx.redirect('/');
      } else {
        if (current) {
          if (validator.isNumeric(current)) {
            await ctx.getPageData();
          } else {
            ctx.redirect('/');
          }
        } else {
          await ctx.getPageData();
        }
      }
    } else {
      ctx.redirect('/');
    }
  }

  async getDataForContentDetails() {
    const ctx = this.ctx;
    const contentId = ctx.params.id;
    if (contentId) {
      if (!shortid.isValid(contentId)) {
        ctx.redirect('/');
      } else {
        // 挂载钩子
        await this.app.hooks(ctx, 'messageBoard', {
          contentId,
        });
        ctx.pageType = 'detail';
        await ctx.getPageData();
      }
    } else {
      ctx.redirect('/');
    }
  }

  async getDataForSiteMap() {
    const ctx = this.ctx;
    ctx.tempPage = 'sitemap.html';
    ctx.pageType = 'sitemap';
    await ctx.getPageData();
  }

  async getDataForErr() {
    const ctx = this.ctx;
    ctx.tempPage = 'public/do' + ctx.errNo + '.html';
    ctx.modules = [
      {
        action: 'get_error_info_' + ctx.errNo,
      },
    ];
    await ctx.getPageData();
  }

  async getDataForPhoneCategory() {
    const ctx = this.ctx;
    ctx.tempPage = 'mb/phone-fenlei.html';
    ctx.pageType = 'phone_fenlei';
    await ctx.getPageData();
  }

  async getDataForPhoneList() {
    const ctx = this.ctx;
    ctx.tempPage = 'mb/phone-list.html';
    ctx.pageType = 'phone_list';
    await ctx.getPageData();
  }

  async getDataForPhoneUser() {
    const ctx = this.ctx;
    ctx.tempPage = 'mb/phone-user.html';
    ctx.pageType = 'phone_list';
    await ctx.getPageData();
  }
}

module.exports = HomeController;
