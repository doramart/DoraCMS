/**
 * api
 * 
 */
const express = require('express')
const router = express.Router()
router.caseSensitive = true
router.strict = true
const {
  authSession,
  cache,
  service,
  validatorUtil
} = require('../../utils');
const authUser = require('../../utils/middleware/authUser');

const { AdminUser, ContentCategory, Content, ContentTag, User, Message, SystemConfig, UserNotify, Ads } = require('../lib/controller');
const _ = require('lodash');
const qr = require('qr-image')

function checkUserSession(req, res, next) {
  if (!_.isEmpty(req.session.user)) {
    next()
  } else {
    res.redirect("/");
  }
}



router.get('/getImgCode', User.getImgCode);

// 查询文档列表
router.get('/content/getList', (req, res, next) => { req.query.state = true; next() }, Content.getContents);

// 查询简单的文档列表
router.get('/content/getSimpleListByParams', (req, res, next) => { req.query.state = true; next() }, Content.getContents)

// 查询文档详情
router.get('/content/getContent', (req, res, next) => { req.query.state = true; next() }, Content.getOneContent)

// 更新喜欢文档
router.get('/content/updateLikeNum', checkUserSession, Content.updateLikeNum)


// 添加或更新文章
router.post('/content/addOne', checkUserSession, (req, res, next) => {
  req.query.role = 'user';

  next();
}, Content.addContent)

router.post('/content/updateOne', checkUserSession, (req, res, next) => {
  req.query.role = 'user';
  next();
}, Content.updateContent)


//文章二维码生成
router.get('/qrImg', (req, res, next) => {
  let detailLink = req.query.detailLink;
  try {
    let img = qr.image(detailLink, { size: 10 });
    res.writeHead(200, { 'Content-Type': 'image/png' });
    img.pipe(res);
  } catch (e) {
    res.writeHead(414, { 'Content-Type': 'text/html' });
    res.end('<h1>414 Request-URI Too Large</h1>');
  }
});

// 管理员登录
router.post('/admin/doLogin', AdminUser.loginAction);

// 获取类别列表
router.get('/contentCategory/getList', (req, res, next) => { req.query.enable = true; next() }, ContentCategory.getContentCategories)

// 获取标签列表
router.get('/contentTag/getList', (req, res, next) => { next() }, ContentTag.getContentTags)

// 获取用户留言列表
router.get('/message/getList', Message.getMessages)

// 获取系统配置信息
router.get('/systemConfig/getConfig', (req, res, next) => { req.query.model = 'simple'; next() }, SystemConfig.getSystemConfigs)

// 根据ID获取广告列表
router.get('/ads/getOne', (req, res, next) => { req.query.state = true; next() }, Ads.getOneAd)

// 获取可见的所有广告信息
router.get('/ads/getAll', (req, res, next) => { req.query.state = true; next() }, Ads.getAds)




module.exports = router