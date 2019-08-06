/*
 * @Author: doramart 
 * @Date: 2019-07-09 14:03:52 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-27 13:05:43
 */

const express = require('express')
const router = express.Router()
router.caseSensitive = true
router.strict = true


const {
  AdminApi,
  UserApi,
  ContentApi,
  MessageApi,
  UserNotifyApi,
  ContentCategoryApi,
  ContentTagApi,
  SystemConfigApi,
  AdsApi,
  SiteMessageApi,
  VersionManageApi,
  ContentTemplateApi
} = require('../lib/controller/api')
const {
  authApiToken,
  renderUserInfo
} = require('@middleware')



//---------------------------------------------------------用户相关api

/**
 * @api {post} /api/v0/user/sendVerificationCode 发送验证码
 * @apiDescription 发送验证码
 * @apiName sendVerificationCode
 * @apiGroup User
 * @apiParam {string} phoneNum 手机号(eq:15220064294)
 * @apiParam {string} countryCode 国家代码（eq: 86）
 * @apiParam {string} email  邮箱
 * @apiParam {string} messageType 发送验证码类别（0、注册 1、登录，2、忘记资金密码找回, 3、忘记密码，4、身份验证, 5、管理员登录，6、游客绑定邮箱或手机号）
 * @apiParam {string} sendType 发送验证码形式（1: 短信验证码  2:邮箱验证码）
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 * {
 *     "status": 200,
 *     "message": "send Code success",
 *     "server_time": 1542382533904,
 *     "data": {
 *         "messageCode": "378047"
 *     }
 * }  
 * @apiError {json} result
 * @apiErrorExample {json} Error-Response:
 *  {
 *    data: {}
 *    message: "验证码错误"
 *    server_time: 1542082677922
 *    status: 500
 *  }
 * @apiSampleRequest http://localhost:8080/api/v0/user/sendVerificationCode
 * @apiVersion 1.0.0
 */
router.post('/user/sendVerificationCode', UserApi.sendVerificationCode);

/**
 * @api {post} /api/v0/user/doLogin 用户登录
 * @apiDescription 用户登录
 * @apiName doLogin
 * @apiGroup User
 * @apiParam {string} phoneNum 手机号（eq:15220064294）
 * @apiParam {string} countryCode 国家代码（eq: 86）
 * @apiParam {string} email 用户邮箱(xx@qq.com)
 * @apiParam {string} loginType 登录类型 (1:手机验证码登录 2:手机号密码登录 3:邮箱密码登录,4:邮箱验证码登录)
 * @apiParam {string} messageCode 手机验证码(eq: 123456)
 * @apiParam {string} password 密码 // 非必填，与短信验证码选其一
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *  {
 *    data: {
 *      comments: ""
 *      date: "2018-11-13 12:09:29"
 *      email: "doramart@qq.com"
 *      enable: true
 *      group: "0"
 *      id: "zwwdJvLmP"
 *      logo: "/upload/images/defaultlogo.png"
 *      userName: "doramart"
 *      token: "eyJkYXRhIjp7InVzZXJJZCI6Inp3d2RKdkxtUCIsInBob25lTnVtIjoxNTIyMDA2NDI5NH0sImNyZWF0ZWQiOjE1NDI2NDMyNTAsImV4cCI6MzYwMH0=.SW3JVAjkQUX0mgrSBuOirB3kQV6NNatlc4j/qW7SxTM="
 *    } 
 *    message: "登录成功"
 *    server_time: 1542089573405
 *    status: 200
 *  }  
 * @apiError {json} result
 * @apiErrorExample {json} Error-Response:
 *  {
 *    data: {}
 *    message: "验证码错误"
 *    server_time: 1542082677922
 *    status: 500
 *  }
 * @apiSampleRequest http://localhost:8080/api/v0/user/doLogin
 * @apiVersion 1.0.0
 */
router.post('/user/doLogin', UserApi.loginAction);

/**
 * @api {post} /api/v0/user/touristLogin 游客登录
 * @apiDescription 游客登录
 * @apiName touristLogin
 * @apiGroup User
 * @apiParam {string} userCode 客户端传递加签字符串
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *  {
 *    data: {
 *      comments: ""
 *      date: "2018-11-13 12:09:29"
 *      enable: true
 *      group: "0"
 *      id: "zwwdJvLmP"
 *      logo: "/upload/images/defaultlogo.png"
 *      userName: "doramart"
 *      token: "eyJkYXRhIjp7InVzZXJJZCI6Inp3d2RKdkxtUCIsInBob25lTnVtIjoxNTIyMDA2NDI5NH0sImNyZWF0ZWQiOjE1NDI2NDMyNTAsImV4cCI6MzYwMH0=.SW3JVAjkQUX0mgrSBuOirB3kQV6NNatlc4j/qW7SxTM="
 *    } 
 *    message: "登录成功"
 *    server_time: 1542089573405
 *    status: 200
 *  }  
 * @apiError {json} result
 * @apiErrorExample {json} Error-Response:
 *  {
 *    data: {}
 *    message: "登录失败"
 *    server_time: 1542082677922
 *    status: 500
 *  }
 * @apiSampleRequest http://localhost:8080/api/v0/user/touristLogin
 * @apiVersion 1.0.0
 */
router.post('/user/touristLogin', UserApi.touristLoginAction);

/**
 * @api {post} /api/v0/user/doReg 用户注册
 * @apiDescription 用户注册
 * @apiName doReg
 * @apiGroup User
 * @apiParam {string} regType 注册类型（1:手机号注册  2:邮箱注册）
 * @apiParam {string} phoneNum 手机号（eq:15220064294）
 * @apiParam {string} countryCode 国家代码（eq: 86）
 * @apiParam {string} messageCode 手机验证码/邮箱验证码(eq: 123456)
 * @apiParam {string} email 注册邮箱
 * @apiParam {string} password 密码
 * @apiParam {string} logo 用户头像
 * @apiParam {string} userName 用户名
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "注册成功",
 *    "server_time": 1544246883076,
 *    "data": {}
 *}
 * @apiError {json} result
 * @apiErrorExample {json} Error-Response:
 *  {
 *    data: {}
 *    message: "注册失败"
 *    server_time: 1542082677922
 *    status: 500
 *  }
 * @apiSampleRequest http://localhost:8080/api/v0/user/doReg
 * @apiVersion 1.0.0
 */
router.post('/user/doReg', UserApi.regAction);


/**
 * @api {post} /api/v0/user/bindInfo 游客绑定邮箱或手机号
 * @apiDescription 游客绑定邮箱或手机号
 * @apiName bindInfo
 * @apiGroup User
 * @apiParam {string} type 绑定类型（1:手机号  2:邮箱）
 * @apiParam {string} phoneNum 手机号（eq:15220064294）
 * @apiParam {string} countryCode 国家代码（eq: 86）
 * @apiParam {string} messageCode 手机验证码/邮箱验证码(eq: 123456)
 * @apiParam {string} email 注册邮箱
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "绑定成功",
 *    "server_time": 1544246883076,
 *    "data": {}
 *}
 * @apiError {json} result
 * @apiErrorExample {json} Error-Response:
 *  {
 *    data: {}
 *    message: "绑定失败"
 *    server_time: 1542082677922
 *    status: 500
 *  }
 * @apiSampleRequest http://localhost:8080/api/v0/user/bindInfo
 * @apiVersion 1.0.0
 */
router.post('/user/bindInfo', authApiToken, UserApi.bindEmailOrPhoneNum);

/**
 * @api {post} /api/v0/user/resetPassword 忘记密码找回
 * @apiDescription 忘记密码找回
 * @apiName resetPassword
 * @apiGroup User
 * @apiParam {string} phoneNum 手机号（eq:15220064294）
 * @apiParam {string} countryCode 国家代码（eq: 86）
 * @apiParam {string} messageCode 手机验证码(eq: 123456)
 * @apiParam {string} email 邮箱(eq: xx@qq.com)
 * @apiParam {string} type 找回方式(1:通过手机号找回，2:通过邮箱找回)
 * @apiParam {string} password 密码
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 * {
 *     "status": 200,
 *     "message": "操作成功！",
 *     "server_time": 1544536543533,
 *     "data": {}
 * }
 * @apiSampleRequest http://localhost:8080/api/v0/user/resetPassword
 * @apiVersion 1.0.0
 */
router.post('/user/resetPassword', UserApi.resetMyPassword);


/**
 * @api {post} /api/v0/user/modifyMyPsd 修改密码
 * @apiDescription 修改密码
 * @apiName modifyMyPsd
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} oldPassword 原密码
 * @apiParam {string} password 新密码
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 * {
 *     "status": 200,
 *     "message": "密码修改成功！",
 *     "server_time": 1544536543533,
 *     "data": {}
 * }
 * @apiSampleRequest http://localhost:8080/api/v0/user/modifyMyPsd
 * @apiVersion 1.0.0
 */
router.post('/user/modifyMyPsd', authApiToken, UserApi.modifyMyPsd);


/**
 * @api {get} /api/v0/user/userInfo 获取登录用户基本信息
 * @apiDescription 获取登录用户信基本信息,需要登录态
 * @apiName userInfo
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *  {
 *    data: {
 *      userInfo: {
 *        comments: ""
 *        phoneNum: "15229908899"
 *        countryCode: "86"
 *        date: "2018-11-13 12:09:29"
 *        email: "doramart@qq.com"
 *        enable: true
 *        group: "0"
 *        id: "zwwdJvLmP"
 *        logo: "/upload/images/defaultlogo.png"
 *        msg_count: { }
 *        userName: "doramart"
 *     }
 *     status: 200
 *  }
 * @apiSampleRequest http://localhost:8080/api/v0/user/userInfo
 * @apiVersion 1.0.0
 */
router.get('/user/userInfo', authApiToken, UserApi.getUserInfoBySession);


/**
 * @api {get} /api/v0/user/followCreator 关注创作者
 * @apiDescription 关注创作者（需要登录状态,后台会通过读取用户session获取用户ID）
 * @apiName /user/followCreator
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} creatorId 创作者id(eq:yNYHEw3-e)
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *  "status": 200,
 *  "message": "操作成功",
 *  "server_time": 1542251075220,
 *  "data": {
 *    
 *  }
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/followCreator
 * @apiVersion 1.0.0
 */
router.get('/user/followCreator', authApiToken, (req, res, next) => {
  req.query.followState = 'in';
  next()
}, UserApi.followCreator)

/**
 * @api {get} /api/v0/user/cancelFollowCreator 取消关注创作者
 * @apiDescription 取消关注创作者（需要登录状态,后台会通过读取用户session获取用户ID）
 * @apiName /user/cancelFollowCreator
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} creatorId 创作者id(eq:yNYHEw3-e)
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *  "status": 200,
 *  "message": "操作成功",
 *  "server_time": 1542251075220,
 *  "data": {
 *    
 *  }
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/cancelFollowCreator
 * @apiVersion 1.0.0
 */
router.get('/user/cancelFollowCreator', authApiToken, (req, res, next) => {
  req.query.followState = 'out';
  next()
}, UserApi.followCreator)



/**
 * @api {get} /api/v0/user/addTags 关注标签
 * @apiDescription 关注标签（需要登录状态,后台会通过读取用户session获取用户ID）
 * @apiName /user/addTags
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} tagId 标签id(eq:yNYHEw3-e)
 * @apiParam {string} type 方式(1:关注 0:取消关注)
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *  "status": 200,
 *  "message": "操作成功",
 *  "server_time": 1542251075220,
 *  "data": {
 *    
 *  }
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/addTags
 * @apiVersion 1.0.0
 */
router.get('/user/addTags', authApiToken, UserApi.addTags)


/**
 * @api {get} /api/v0/user/askContentThumbsUp 帖子点赞
 * @apiDescription 帖子点赞，需要登录态
 * @apiName /user/askContentThumbsUp
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} contentId 帖子ID/评论ID/社群帖ID
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "操作成功！",
 *    "server_time": 1543372263586,
 *    "data": {}
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/askContentThumbsUp
 * @apiVersion 1.0.0
 */
router.get('/user/askContentThumbsUp', authApiToken, (req, res, next) => {
  req.query.praiseState = 'in';
  next();
}, UserApi.askContentThumbsUp)

/**
 * @api {get} /api/v0/user/cancelContentThumbsUp 取消帖子点赞
 * @apiDescription 取消帖子点赞
 * @apiName /user/cancelContentThumbsUp
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} contentId 帖子ID/评论ID/社群帖ID
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "操作成功！",
 *    "server_time": 1543372263586,
 *    "data": {}
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/cancelContentThumbsUp
 * @apiVersion 1.0.0
 */
router.get('/user/cancelContentThumbsUp', authApiToken, (req, res, next) => {
  req.query.praiseState = 'out';
  next();
}, UserApi.askContentThumbsUp)


/**
 * @api {get} /api/v0/user/favoriteContent 收藏帖子
 * @apiDescription 收藏帖子，需要登录态,包含普通帖子，专题或社群帖子
 * @apiName /user/favoriteContent
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} contentId 帖子ID
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "操作成功！",
 *    "server_time": 1543372263586,
 *    "data": {}
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/favoriteContent
 * @apiVersion 1.0.0
 */
router.get('/user/favoriteContent', authApiToken, (req, res, next) => {
  req.query.favoriteState = 'in';
  next();
}, UserApi.favoriteContent)

/**
 * @api {get} /api/v0/user/cancelFavoriteContent 取消收藏帖子
 * @apiDescription 取消收藏帖子，需要登录态
 * @apiName /user/cancelFavoriteContent
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} contentId 帖子ID
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "操作成功！",
 *    "server_time": 1543372263586,
 *    "data": {}
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/favoriteContent
 * @apiVersion 1.0.0
 */
router.get('/user/cancelFavoriteContent', authApiToken, (req, res, next) => {
  req.query.favoriteState = 'out';
  next();
}, UserApi.favoriteContent)


/**
 * @api {get} /api/v0/user/getMyFavoriteContents 获取我收藏的帖子列表
 * @apiDescription 获取我收藏的帖子列表 带分页
 * @apiName /user/getMyFavoriteContents
 * @apiGroup User
 * @apiParam {string} current 当前页码
 * @apiParam {string} pageSize 每页记录数
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *   "status": 200,
 *   "message": "contentlist",
 *   "server_time": 1542380520270,
 *   "data": [
 *       {
 *           "_id": "Y1XFYKL52",
 *           "title": "如何优化vue的内存占用？",
 *           "stitle": "如何优化vue的内存占用？",
 *           "sortPath": "",
 *           "keywords": "",
 *           "author": {
 *               "_id": "4JiWCMhzg",
 *               "userName": "doramart",
 *               "name": "生哥",
 *               "logo": "/upload/smallimgs/img1448202744000.jpg"
 *           },
 *           "discription": "在使用了一段时间的vue.js开发移动端h5页面（电商类页面，会有一些数据量较大但一次渲染就可以的商品列表）后",
 *           "comments": "在使用了一段时间的vue.js开发移动端h5页面（电商类页面，会有一些数据量较大但一次渲染就可以的商品列表）后，感觉相比于传统的jquery（zepto）和前端模板引擎的组合能有效的提升开发效率和代码维护性，但是也存在一些问题，比如说内存占用问题，用vue.js开发的页面内存占用相比于传统方式会更多，而且传统的开发方式页面渲染完后，还能对不需要的js对象进行垃圾回收，但vue.js里面的一些指令对象、watcher对象、data数据等似乎目前都没有找到比较好的垃圾回收的方式。想问下对于那些只用渲染一次的页面部分（比如数据量较大的列表页）有没有比较合适的内存优化方案（比如释放指令对象、watcher对象、data对象）？举个例子：比如其中的lazy指令，以及对于items这个基本上只用渲染一次的data等有没有可以优化内存占用的方法",
 *           "likeNum": 0,
 *           "commentNum": 0,
 *           "clickNum": 1,
 *           "isTop": 0,
 *           "state": true,
 *           "updateDate": "2018-11-16",
 *           "date": "2018-11-16 23:00:16",
 *           "appShowType": "0", // app端展示模式 0，1，2，3
 *           "sImg": "/upload/images/img20181116225948.jpeg",
 *           "tags": [
 *               {
 *                "_id": "Y3DTgmHK3",
 *                "name": "区块链",
 *                "date": "2018-11-16 23:02:00",
 *                "id": "Y3DTgmHK3"
 *                }
 *            ],
 *           "categories": [
 *                {
 *                "_id": "Nycd05pP",
 *                "name": "人工智能",
 *                "defaultUrl": "artificial-intelligence",
 *                "enable": true,
 *                "date": "2018-11-16 23:02:00",
 *                "id": "Nycd05pP"
 *                }
 *            ],
 *           "type": "1",
 *           "id": "Y1XFYKL52"
 *        }
 *    ]
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/getMyFavoriteContents
 * @apiVersion 1.0.0
 */
router.get('/user/getMyFavoriteContents', authApiToken, ContentApi.getMyFavoriteContents);


/**
 * @api {get} /api/v0/user/despiseContent 踩帖子
 * @apiDescription 踩帖子，需要登录态
 * @apiName /user/despiseContent
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} contentId 帖子ID/评论ID
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "操作成功！",
 *    "server_time": 1543372263586,
 *    "data": {}
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/favoriteContent
 * @apiVersion 1.0.0
 */
router.get('/user/despiseContent', authApiToken, (req, res, next) => {
  req.query.despiseState = 'in';
  next();
}, UserApi.despiseContent)

/**
 * @api {get} /api/v0/user/cancelDespiseContent 取消踩帖子
 * @apiDescription 取消踩帖子，需要登录态
 * @apiName /user/cancelDespiseContent
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} contentId 帖子ID/评论ID/社群帖ID
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "操作成功！",
 *    "server_time": 1543372263586,
 *    "data": {}
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/cancelDespiseContent
 * @apiVersion 1.0.0
 */
router.get('/user/cancelDespiseContent', authApiToken, (req, res, next) => {
  req.query.despiseState = 'out';
  next();
}, UserApi.despiseContent)




/**
 * @api {post} /api/v0/user/postMessages 帖子评论/留言
 * @apiDescription 帖子评论/留言，需要登录态
 * @apiName /user/postMessages
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} contentId 帖子ID
 * @apiParam {string} replyAuthor 回复者ID (二级留言必填)
 * @apiParam {string} relationMsgId 回复目标留言ID (二级留言必填)
 * @apiParam {string} content 评论内容
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "操作成功！",
 *    "server_time": 1543372263586,
 *    "data": {}
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/postMessages
 * @apiVersion 1.0.0
 */
router.post('/user/postMessages', authApiToken, MessageApi.postMessages)


/**
 * @api {get} /api/v0/user/checkPhoneNumExist 校验注册手机号是否存在
 * @apiDescription 校验注册手机号是否存在
 * @apiName /user/checkPhoneNumExist
 * @apiGroup User
 * @apiParam {string} countryCode 国家代码
 * @apiParam {string} phoneNum 注册手机号
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *  "status": 200,
 *  "message": "checkPhoneNumExist success",
 *  "server_time": 1544245281332,
 *  "data": {
 *    "checkState": true  // true/存在  false/不存在
 *  }
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/checkPhoneNumExist
 * @apiVersion 1.0.0
 */
router.get('/user/checkPhoneNumExist', UserApi.checkPhoneNumExist)

/**
 * @api {get} /api/v0/user/checkHadSetLoginPassword 校验用户是否已设置登录密码
 * @apiDescription 校验用户是否已设置登录密码，需要登录态
 * @apiName /user/checkHadSetLoginPassword
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *  "status": 200,
 *  "message": "checkHadSetLoginPassword success",
 *  "server_time": 1544245281332,
 *  "data": {
 *    "checkState": true  // true/已设置  false/未设置
 *  }
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/checkHadSetLoginPassword
 * @apiVersion 1.0.0
 */
router.get('/user/checkHadSetLoginPassword', authApiToken, UserApi.checkHadSetLoginPassword)


/**
 * @api {post} /api/v0/user/updateInfo 修改用户信息
 * @apiDescription 修改用户信息，需要登录态
 * @apiName /user/updateInfo
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} profession 职业
 * @apiParam {string} industry 行业
 * @apiParam {string} experience 教育经历
 * @apiParam {string} logo 头像
 * @apiParam {string} gender 性别 0男 1女
 * @apiParam {string} name 姓名
 * @apiParam {string} userName 昵称
 * @apiParam {string} phoneNum 手机号
 * @apiParam {string} introduction 一句话介绍
 * @apiParam {string} comments 个人简介
 * @apiParam {string} province 所在省份
 * @apiParam {string} city 所在城市
 * @apiParam {string} birth 出生年月日 2018-09-21
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "操作成功！",
 *    "server_time": 1543372263586,
 *    "data": {}
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/updateInfo
 * @apiVersion 1.0.0
 */
router.post('/user/updateInfo', authApiToken, UserApi.updateUser);

/**
 * @api {get} /api/v0/user/getUserNotifys 获取系统公告
 * @apiDescription 获取系统公告，带分页，需要登录态
 * @apiName /user/getUserNotifys
 * @apiGroup Messages
 * @apiParam {string} current 当前页码
 * @apiParam {string} pageSize 每页记录数
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "操作成功 userNotify",
 *    "server_time": 1542530587287,
 *    "data": [
 *        {
 *            "_id": "myh0RzkV3H",
 *            "user": "zwwdJvLmP",
 *            "notify": {
 *               "_id": "5mCBWXS-B",
 *               "title": "这是一条私信，不要偷偷打开哟。。。",
 *               "content": "<p>这是一条私信，不要偷偷打开哟。。。</p>",
 *               "date": "2018-11-18 16:43:07",
 *               "id": "5mCBWXS-B"
 *            },
 *            "__v": 0,
 *            "date": "2018-11-18 16:13:47",
 *            "isRead": false,
 *            "id": "myh0RzkV3H"
 *       }
 *    ]
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/getUserNotifys
 * @apiVersion 1.0.0
 */
router.get('/user/getUserNotifys', authApiToken, UserNotifyApi.getUserNotifys);


/**
 * @api {get} /api/v0/user/setNoticeRead 设置系统公告为已读
 * @apiDescription 设置系统公告为已读
 * @apiName /user/setNoticeRead
 * @apiGroup Messages
 * @apiParam {string} ids 消息id,多个id用逗号隔开,全部传 all
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "设置已读成功",
 *    "server_time": 1542529985218,
 *    "data": {}
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/setNoticeRead
 * @apiVersion 1.0.0
 */
router.get('/user/setNoticeRead', authApiToken, UserNotifyApi.setMessageHasRead);

// 删除用户消息
router.get('/user/delUserNotify', authApiToken, UserNotifyApi.delUserNotify);


/**
 * @api {get} /api/v0/user/getMessages 获取评论列表
 * @apiDescription 获取评论列表 带分页
 * @apiName /user/getMessages
 * @apiGroup User
 * @apiParam {string} current 当前页码
 * @apiParam {string} pageSize 每页记录数
 * @apiParam {string} userId 获取指定用户的评论,传用户id
 * @apiParam {string} contentId 获取指定文章的评论,传文档id
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *  "status": 200,
 *  "message": "操作成功 message",
 *  "server_time": 1542899024811,
 *  "data": [
 *    {
 *  "_id": "tYVGV-HTL",
 *  "author": {
 *     "_id": "zwwdJvLmP",
 *     "userName": "doramart",
 *     "logo": "/upload/images/defaultlogo.png",
 *     "date": "2018-11-13 12:09:29",
 *     "enable": true,
 *     "id": "zwwdJvLmP"
 *   },
 *  "contentId": {
 *  "_id": "R8_iIMwF1",
 *  "title": "海底捞的致命缺点是什么？",
 *  "stitle": "海底捞的致命缺点是什么？",
 *  "updateDate": "2018-11-22",
 *  "date": "2018-11-22 23:03:44",
 *  "id": "R8_iIMwF1"
 *      },
 *  "__v": 0,
 *  "content": "这也是一条留言",
 *  "hasPraise": false,
 *  "praiseNum": 0,
 *  "date": "3 天前",
 *  "utype": "0",
 *  "id": "tYVGV-HTL"
 *    },
 *    {
 *  "_id": "4wv0tcLjH",
 *  "author": {
 *  "_id": "zwwdJvLmP",
 *  "userName": "doramart",
 *  "logo": "/upload/images/defaultlogo.png",
 *  "date": "2018-11-13 12:09:29",
 *  "enable": true,
 *  "id": "zwwdJvLmP"
 *      },
 *  "contentId": {
 *  "_id": "vGVoKV0g_",
 *  "title": "有哪一刹那让你对日本的美好印象瞬间破灭？",
 *  "stitle": "有哪一刹那让你对日本的美好印象瞬间破灭？",
 *  "updateDate": "2018-11-22",
 *  "date": "2018-11-22 23:03:44",
 *  "id": "vGVoKV0g_"
 *      },
 *  "__v": 0,
 *  "content": "这是一条留言",
 *  "hasPraise": false,
 *  "praiseNum": 0,
 *  "date": "3 天前",
 *  "utype": "0",
 *  "id": "4wv0tcLjH"
 *    }
 *  ]
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/getMessages
 * @apiVersion 1.0.0
 */
router.get('/user/getMessages', renderUserInfo, MessageApi.list);


/**
 * @api {get} /api/v0/user/getUserContents 查询指定用户的文档列表
 * @apiDescription 查询指定用户的文档列表，带分页
 * @apiName /user/getUserContents
 * @apiGroup User
 * @apiParam {string} current 当前页码
 * @apiParam {string} pageSize 每页记录数
 * @apiParam {string} userId 指定用户的ID
 * @apiParam {string} listState 针对本人可以根据状态显示文档列表(all:全部)
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *  "status": 200,
 *  "message": "contentlist",
 *  "server_time": 1542891752268,
 *  "data": [
 *    {
 *      "_id": "jRInYUowi",
 *      "title": "六小龄童做了什么事引来这么多的口诛笔伐？",
 *      "stitle": "六小龄童做了什么事引来这么多的口诛笔伐？",
 *      "author": null,
 *      "discription": "蓉城圆滚滚： 今天上午刚好听完六小龄童的现场讲座，有视频有真相，还是先附上一段现场版视频吧～ 这是我们省图书馆的一个讲座系列活动，叫“巴蜀讲坛”。通常会在周末邀请很多知名专家学者给大家做一些学术或者科普讲…",
 *      "comments": "9:00的时候开始入场，我虽然到的挺早，但还是只在报告厅的倒数第二排的角落里找到了个位置～大家陆续进场后，工作人员就开始在台上频繁地说：讲座结束后，章老师会有签名活动，为了避免拥挤，大家现在就可以在报告厅门口去购书～～（其实省图挺少接这种签售活动，就算接，一般也是安排在楼上的小活动室里，而不会在这个大报告厅，果然明星还是比较有面儿的哇～）讲座准时开始的，第一个环节是捐赠仪式，大约是捐赠了6套还是8套章老师的书给图书馆来着↓↓↓（红色衣服的是章老师，旁边那位是图书馆某个部门的主任～其实，我大约记得之前几位第一次来馆里办讲座的老师都是副馆长来致欢迎词的～）",
 *      "uAuthor": {
 *        "_id": "zwwdJvLmP",
 *        "userName": "doramart",
 *        "logo": "/upload/images/defaultlogo.png",
 *        "date": "2018-11-22 21:02:32",
 *        "id": "zwwdJvLmP"
 *      },
 *      "__v": 0,
 *      "keywords": null,
 *      "likeNum": 0, // 点赞总数
 *      "commentNum": 0, // 留言总数
 *      "favoriteNum": 0, // 收藏总数
 *      "despiseNum": 0, // 踩帖总数
 *      "clickNum": 1,  
 *      "isTop": 1,
 *      "state": true,
 *      "updateDate": "2018-11-18",
 *      "date": "2018-11-18 20:49:29",
 *      "appShowType": "0",
 *      "sImg": "/upload/images/img20181118203911.jpeg",
 *      "tags": [
 *        
 *      ],
 *      "categories": [
 *        
 *      ],
 *      "type": "1",
 *      "id": "jRInYUowi"
 *      "hasPraised": false // 当前用户是否已赞�
 *      "total_reward_num": 0  // 打赏总额
 *      "hasReworded": false // 当前用户是否已打赏�
 *      "hasComment": false // 当前用户是否已评论
 *      "hasFavorite": false // 当前用户是否已收藏
 *      "hasDespise": false // 当前用户是否已踩
 *    },
 *    ...
 *  ]
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/getUserContents
 * @apiVersion 1.0.0
 */
router.get('/user/getUserContents', renderUserInfo, ContentApi.list);


/**
 * @api {get} /api/v0/user/getMyFollowInfos 我的关注
 * @apiDescription 我的关注，获取我关注的创作者，专题，已经关注创作者的帖子等相关信息，目前不带分页
 * @apiName /user/getMyFollowInfos
 * @apiGroup User
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *  "status": 200,
 *  "message": "getMyFollowInfos",
 *  "server_time": 1542900168427,
 *  "data": {
 *   "watchersList": [ // 我关注的创作者
 *      {
 *       "_id": "yNYHEw3-e",
 *       "userName": "yoooyu",
 *       "name": "创作者兄",
 *       "date": "2018-11-22 23:22:48",
 *       "id": "yNYHEw3-e"
 *      }
 *    ],
 *   "watchSpecialList": [ // 我关注的专题
 *      {
 *       "_id": "eF0Djunws",
 *       "name": "人工智能",
 *       "comments": "关注人工智能，人人都有机会",
 *       "sImg": "/upload/images/img20181117213151.png",
 *       "date": "2018-11-22 23:22:48",
 *       "id": "eF0Djunws"
 *      }
 *    ],
 *   "watchCreatorContents": [ // 我关注的相关内容
 *      {
 *       "_id": "Y1XFYKL52",
 *       "title": "如何优化vue的内存占用？",
 *       "stitle": "如何优化vue的内存占用？",
 *       "sortPath": "",
 *       "keywords": "",
 *       "uAuthor": "yNYHEw3-e",
 *       "discription": "在使用了一段时间的vue.js开发移动端h5页面（电商类页面，会有一些数据量较大但一次渲染就可以的商品列表）后",
 *       "comments": "<p><span>在使用了一段时间的vue.js开发移动端h5页面（电商类页面，会有一些数据量较大但一次渲染就可以的商品列表）后，感觉相比于传统的jquery（zepto）和前端模板引擎的组合能有效的提升开发效率和代码维护性，但是也存在一些问题，比如说内存占用问题，用vue.js开发的页面内存占用相比于传统方式会更多，而且传统的开发方式页面渲染完后，还能对不需要的js对象进行垃圾回收，但vue.js里面的一些指令对象、watcher对象、data数据等似乎目前都没有找到比较好的垃圾回收的方式。</span><br /><br /><span>想问下对于那些只用渲染一次的页面部分（比如数据量较大的列表页）有没有比较合适的内存优化方案（比如释放指令对象、watcher对象、data对象）？</span><br /><br /><span>举个例子：</span><br /><br /><span>比如其中的lazy指令，以及对于items这个基本上只用渲染一次的data等有没有可以优化内存占用的方法</span></p>",
 *       "twiterAuthor": "",
 *       "translate": "",
 *       "bearish": [
 *          
 *        ],
 *       "profitable": [
 *          
 *        ],
 *       "isFlash": false,
 *       "__v": 0,
 *       "author": "",
 *       "likeNum": 0,
 *       "commentNum": 0,
 *       "clickNum": 5,
 *       "isTop": 1,
 *       "state": true,
 *       "updateDate": "2018-11-16",
 *       "date": "2018-11-16 23:00:16",
 *       "appShowType": "0",
 *       "sImg": "/upload/images/img20181116225948.jpeg",
 *       "tags": [
 *       "Y3DTgmHK3"
 *        ],
 *       "categories": [
 *          
 *        ],
 *       "type": "1",
 *       "id": "Y1XFYKL52"
 *      }
 *    ]
 *  }
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/user/getMyFollowInfos
 * @apiVersion 1.0.0
 */
router.get('/user/getMyFollowInfos', authApiToken, UserApi.getMyFollowInfos);


// 用户注销
router.get('/user/logOut', authApiToken, UserApi.logOut);

//提交验证邮箱
router.post('/user/sentConfirmEmail', UserApi.sentConfirmEmail);

// 更新密码
router.post('/user/updateNewPsd', UserApi.updateNewPsd);

// 发送邮件给管理员(联系我们)
router.post('/user/postEmailToAdminUser', UserApi.postEmailToAdminUser);

// 管理员登录
router.post('/admin/doLogin', AdminApi.loginAction);

// 获取管理员登录验证码
router.get('/getImgCode', UserApi.getImgCode);

//点击找回密码链接跳转页面
router.get('/user/reset_pass', UserApi.reSetPass);

// 设置新密码
router.post('/user/updateNewPsd', UserApi.updateNewPsd);


//---------------------------------------------------------文档相关api


/**
 * @api {get} /api/v0/content/getList 查询帖子列表
 * @apiDescription 根据参数获取对应的帖子列表,默认按时间查询，可作为发现栏目列表
 * @apiName /content/getList
 * @apiGroup Contents
 * @apiParam {string} current 当前页码
 * @apiParam {string} pageSize 每页记录数
 * @apiParam {string} searchkey 搜索关键字
 * @apiParam {string} userId 指定作者ID
 * @apiParam {string} model (1:推荐帖子)
 * @apiParam {string} sortby 按字段排序(0:默认按时间，1:热门)
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 {
 *   "status": 200,
 *   "message": "contentlist",
 *   "server_time": 1542380520270,
 *   "data": [
 *       {
 *           "_id": "Y1XFYKL52",
 *           "title": "如何优化vue的内存占用？",
 *           "stitle": "如何优化vue的内存占用？",
 *           "sortPath": "",
 *           "keywords": "",
 *           "author": {
 *               "_id": "4JiWCMhzg",
 *               "userName": "doramart",
 *               "name": "生哥",
 *               "logo": "/upload/smallimgs/img1448202744000.jpg"
 *           },
 *           "discription": "在使用了一段时间的vue.js开发移动端h5页面（电商类页面，会有一些数据量较大但一次渲染就可以的商品列表）后",
 *           "comments": "在使用了一段时间的vue.js开发移动端h5页面（电商类页面，会有一些数据量较大但一次渲染就可以的商品列表）后，感觉相比于传统的jquery（zepto）和前端模板引擎的组合能有效的提升开发效率和代码维护性，但是也存在一些问题，比如说内存占用问题，用vue.js开发的页面内存占用相比于传统方式会更多，而且传统的开发方式页面渲染完后，还能对不需要的js对象进行垃圾回收，但vue.js里面的一些指令对象、watcher对象、data数据等似乎目前都没有找到比较好的垃圾回收的方式。想问下对于那些只用渲染一次的页面部分（比如数据量较大的列表页）有没有比较合适的内存优化方案（比如释放指令对象、watcher对象、data对象）？举个例子：比如其中的lazy指令，以及对于items这个基本上只用渲染一次的data等有没有可以优化内存占用的方法",
 *           "translate": "",
 *           "bearish": [],
 *           "profitable": [],
 *           "from": "1",
 *           "likeUserIds": [],
 *           "likeNum": 0, // 点赞总数
 *           "commentNum": 0, // 留言总数
 *           "favoriteNum": 0, // 收藏总数
 *           "despiseNum": 0, // 踩帖总数
 *           "clickNum": 1,
 *           "isTop": 0,
 *           "state": true,
 *           "updateDate": "2018-11-16",
 *           "date": "2018-11-16 23:00:16",
 *           "appShowType": "0", // app端展示模式 0，1，2，3
 *           "duration": "0:01",, // 针对视频的视频时长
 *           "sImg": "/upload/images/img20181116225948.jpeg",
 *           "tags": [
 *               {
 *                "_id": "Y3DTgmHK3",
 *                "name": "区块链",
 *                "date": "2018-11-16 23:02:00",
 *                "id": "Y3DTgmHK3"
 *                }
 *            ],
 *           "categories": [
 *                {
 *                "_id": "Nycd05pP",
 *                "name": "人工智能",
 *                "defaultUrl": "artificial-intelligence",
 *                "enable": true,
 *                "date": "2018-11-16 23:02:00",
 *                "id": "Nycd05pP"
 *                }
 *            ],
 *           "type": "1",
 *           "id": "Y1XFYKL52"
 *           "hasPraised": false // 当前用户是否已赞�
 *           "hasReworded": false // 当前用户是否已打赏�
 *           "hasComment": false // 当前用户是否已评论
 *           "hasFavorite": false // 当前用户是否已收藏
 *           "hasDespise": false // 当前用户是否已踩
 *           "total_reward_num": 0  // 打赏总额
 *        }
 *    ]
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/content/getList
 * @apiVersion 1.0.0
 */
router.get('/content/getList', renderUserInfo, ContentApi.list);


/**
 * @api {get} /api/v0/content/getRadomContents 获取随机文档列表
 * @apiDescription 获取随机文档列表 不分页
 * @apiName /content/getRadomContents
 * @apiGroup Contents
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 {
 *   "status": 200,
 *   "message": "contentlist",
 *   "server_time": 1542380520270,
 *   "data": [
 *       {
 *           "_id": "Y1XFYKL52",
 *           "title": "如何优化vue的内存占用？",
 *           "stitle": "如何优化vue的内存占用？",
 *           "sortPath": "",
 *           "keywords": "",
 *           "author": {
 *               "_id": "4JiWCMhzg",
 *               "userName": "doramart",
 *               "name": "生哥",
 *               "logo": "/upload/smallimgs/img1448202744000.jpg"
 *           },
 *           "discription": "在使用了一段时间的vue.js开发移动端h5页面（电商类页面，会有一些数据量较大但一次渲染就可以的商品列表）后",
 *           "comments": "在使用了一段时间的vue.js开发移动端h5页面（电商类页面，会有一些数据量较大但一次渲染就可以的商品列表）后，感觉相比于传统的jquery（zepto）和前端模板引擎的组合能有效的提升开发效率和代码维护性，但是也存在一些问题，比如说内存占用问题，用vue.js开发的页面内存占用相比于传统方式会更多，而且传统的开发方式页面渲染完后，还能对不需要的js对象进行垃圾回收，但vue.js里面的一些指令对象、watcher对象、data数据等似乎目前都没有找到比较好的垃圾回收的方式。想问下对于那些只用渲染一次的页面部分（比如数据量较大的列表页）有没有比较合适的内存优化方案（比如释放指令对象、watcher对象、data对象）？举个例子：比如其中的lazy指令，以及对于items这个基本上只用渲染一次的data等有没有可以优化内存占用的方法",
 *           "translate": "",
 *           "bearish": [],
 *           "profitable": [],
 *           "from": "1",
 *           "likeUserIds": [],
 *           "likeNum": 0, // 点赞总数
 *           "commentNum": 0, // 留言总数
 *           "favoriteNum": 0, // 收藏总数
 *           "despiseNum": 0, // 踩帖总数
 *           "clickNum": 1,
 *           "isTop": 0,
 *           "state": true,
 *           "updateDate": "2018-11-16",
 *           "date": "2018-11-16 23:00:16",
 *           "appShowType": "0", // app端展示模式 0，1，2，3
 *           "duration": "0:01",, // 针对视频的视频时长
 *           "sImg": "/upload/images/img20181116225948.jpeg",
 *           "tags": [
 *               {
 *                "_id": "Y3DTgmHK3",
 *                "name": "区块链",
 *                "date": "2018-11-16 23:02:00",
 *                "id": "Y3DTgmHK3"
 *                }
 *            ],
 *           "categories": [
 *                {
 *                "_id": "Nycd05pP",
 *                "name": "人工智能",
 *                "defaultUrl": "artificial-intelligence",
 *                "enable": true,
 *                "date": "2018-11-16 23:02:00",
 *                "id": "Nycd05pP"
 *                }
 *            ],
 *           "type": "1",
 *           "id": "Y1XFYKL52"
 *           "hasPraised": false // 当前用户是否已赞�
 *           "hasReworded": false // 当前用户是否已打赏�
 *           "hasComment": false // 当前用户是否已评论
 *           "hasFavorite": false // 当前用户是否已收藏
 *           "hasDespise": false // 当前用户是否已踩
 *           "total_reward_num": 0  // 打赏总额
 *        }
 *    ]
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/content/getRadomContents
 * @apiVersion 1.0.0
 */
router.get('/content/getRadomContents', renderUserInfo, ContentApi.getRadomContents);

// 随机文章图片
router.get('/content/getRandomContentImg', ContentApi.getRandomContentImg);


// 首页推荐列表
router.get('/content/getRecommendedList', renderUserInfo, ContentApi.getTopIndexContents);



/**
 * @api {post} /api/v0/upload/files 文件上传
 * @apiDescription 文件上传，上传用户头像等
 * @apiName /api/v0/upload/files
 * @apiGroup User
 * @apiParam {file} file 文件
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "get data success",
 *    "server_time": 1544167579835,
 *    "data": 
 *    {
 *       "path": "http://creatorchain.oss-cn-hongkong.aliyuncs.com/upload/images/img1544167579253.png" // 文件链接
 *    } 
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/upload/files
 * @apiVersion 1.0.0
 */


/**
 * @api {get} /api/v0/content/getContent 查询帖子详情
 * @apiDescription 查询帖子详情(只普通帖子或专题)
 * @apiName /api/v0/content/getContent
 * @apiGroup Contents
 * @apiParam {string} id 帖子Id
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 * {
 *  "status": 200,
 *  "message": "content",
 *  "server_time": 1545154926558,
 *  "data": {
 *     "_id": "ri5WaXugX",
 *     "title": "谷歌AI首席科学家：想当研究科学家，一事无成你受得了吗？",
 *     "stitle": "谷歌AI首席科学家：想当研究科学家，一事无成你受得了吗？",
 *     "sortPath": "",
 *     "keywords": "",
 *     "uAuthor": {
 *        "_id": "uUKsBv5y_",
 *        "userName": "creator10",
 *        "logo": "https://cg2010studio.files.wordpress.com/2015/12/cartoonavatar2.jpg",
 *        "date": "2018-12-19 01:42:06",
 *        "id": "uUKsBv5y_"
 *     },
 *     "discription": "AI研究科学家不是那么好当的！近日谷歌AI首席科学家Vincent Vanhoucke发表在Medium上的文章引来众人关注。在本文中，他列举了成为研究科学家所要面对的9大挑战，看完这篇内容或许可以在立志投身于科学事业前，给你先“泼一盆冷水”。",
 *     "__v": 0,
 *     "author": {
 *        "userName": "doramart",
 *        "name": "超管",
 *        "logo": "/upload/smallimgs/img1448202744000.jpg"
 *     },
 *     "simpleComments": [
 *       {
 *        "type": "contents",
 *        "content": "做一名研究人员可能会让你的人生非常充实并得到他人的认可。但我知道很多学生在做研究时受到前景的压力，一时陷入工程的舒适区。他们通常把这个阶段视为个人失败，觉得自己“不够优秀”。而根据我个人的经验，这从来就不是个人价值或者天赋的问题：在研究中成长需要某种不同的气质，这种气质往往与工程师成长的原因有些矛盾。以下是我见过的研究人员在职业生涯的某个阶段不得不面对的一些主要压力：\n  \n做研究要解决的是有多个答案（或没有答案）的不适定问题\n                               *        "
 *       },
 *       {
 *        "type": "video",
 *        "content": "http://creatorchain.oss-cn-hongkong.aliyuncs.com/upload/images/1071402816293179392.mp4"
 *       },
 *       {
 *        "type": "contents",
 *        "content": " \n\n大学教育很大程度上教会了你如何用特定的方案解决适定问题，但用这种方式去对待研究却注定失败。你在研究中做的很多事并不会让你接近答案，而是让你更好地理解问题。 \n"
 *       },
 *       {
 *        "type": "image",
 *        "content": "http://creatorchain.oss-cn-hongkong.aliyuncs.com/upload/images/1075054319700676608.png"
 *       },
 *       {
 *        "type": "contents",
 *        "content": " \n用学到的东西，而不是取得的研究进展来衡量自己的进步，是一个人在研究环境中必须经历的重要范式转变之一。\n\n"
 *       }
 *     ],
 *     "likeNum": 0,
 *     "commentNum": 10,
 *     "clickNum": 77,
 *     "isTop": 1,
 *     "state": true,
 *     "updateDate": "2018-12-08 21:37:38",
 *     "date": "2018-12-08 21:37:38",
 *     "duration": "0:01",
 *     "videoArr": [
 *        "http://creatorchain.oss-cn-hongkong.aliyuncs.com/upload/images/1071402816293179392.mp4"
 *     ],
 *     "imageArr": [
 *        "http://creatorchain.oss-cn-hongkong.aliyuncs.com/upload/images/1075054319700676608.png"
 *     ],
 *     "appShowType": "3",
 *     "videoImg": "http://creatorchain.oss-cn-hongkong.aliyuncs.com/upload/images/1071402816293179392_thumbnail.jpg", // 视频缩略图（当appShowType=3）
 *     "sImg": "http://creatorchain.oss-cn-hongkong.aliyuncs.com/upload/images/img1544276235259.jpg",
 *     "tags": [
 *       {
 *        "_id": "aGE-YfyLRjx",
 *        "name": "化学",
 *        "date": "2018-12-19 01:42:06",
 *        "id": "aGE-YfyLRjx"
 *       },
 *       {
 *        "_id": "_euYIiOqvLA",
 *        "name": "体育",
 *        "date": "2018-12-19 01:42:06",
 *        "id": "_euYIiOqvLA"
 *       }
 *     ],
 *     "categories": [
 *       
 *     ],
 *     "type": "1",
 *     "id": "ri5WaXugX",
 *     "hasPraised": false,
 *     "hasReworded": false,
 *     "hasComment": true,
 *     "hasFavorite": false,
 *     "hasDespise": false,
 *     "total_reward_num": 0,
 *     "favoriteNum": 0,
 *     "despiseNum": 0
 *   }
 * }
 * @apiSampleRequest http://localhost:8080/api/v0/content/getContent
 * @apiVersion 1.0.0
 */
router.get('/content/getContent', renderUserInfo, ContentApi.getOneContent)




/**
 * @api {post} /api/v0/content/addOne 创建文档
 * @apiDescription 创建文档
 * @apiName /content/addOne
 * @apiParam {string}  token 登录时返回的参数鉴权
 * @apiParam {string}  title   文档标题，必填
 * @apiParam {string}  discription  文档简介，必填
 * @apiParam {string}  sImg  文档首图(url)，必填
 * @apiParam {string}  type    文档类型，必填(1:普通)
 * @apiParam {string}  draft   是否草稿(1:是，0:不是)
 * @apiParam {string}  tags   文档标签ID(目前只传1个)，必填
 * @apiParam {string}  keywords   关键字,非必填
 * @apiParam {string}  comments   文档详情(html 格式，必填)
 * @apiParam {string}  simpleComments   文档详情简约版(html 格式，客户端端传值和comments字段一样，必填)
 * @apiGroup Contents
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "addContent",
 *    "server_time": 1548037382973,
 *    "data": {
 *    }
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/content/addOne
 * @apiVersion 1.0.0
 */
router.post('/content/addOne', authApiToken, ContentApi.addContent)


/**
 * @api {post} /api/v0/content/updateOne 更新文档
 * @apiDescription 更新文档
 * @apiName /content/updateOne
 * @apiParam {string}  token 登录时返回的参数鉴权
 * @apiParam {string}  id 文档ID
 * @apiParam {string}  title   文档标题，必填
 * @apiParam {string}  discription  文档简介，必填
 * @apiParam {string}  sImg  文档首图(url)，必填
 * @apiParam {string}  type    文档类型，必填(1:普通)
 * @apiParam {string}  draft   是否草稿(1:是，0:不是)
 * @apiParam {string}  tags   文档标签ID(目前只传1个)，必填
 * @apiParam {string}  keywords   关键字,非必填
 * @apiParam {string}  comments   文档详情(html 格式，必填)
 * @apiParam {string}  simpleComments   文档详情简约版(html 格式，客户端端传值和comments字段一样，必填)
 * @apiGroup Contents
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "addContent",
 *    "server_time": 1548037382973,
 *    "data": {
 *    }
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/content/updateOne
 * @apiVersion 1.0.0
 */
router.post('/content/updateOne', authApiToken, ContentApi.updateContent)

//文章二维码生成
router.get('/content/qrImg', ContentApi.getContentQr);



/**
 * @api {get} /api/v0/contentCategory/getList 获取文档类别列表
 * @apiDescription 获取文档类别列表
 * @apiName /contentCategory/getList
 * @apiGroup Contents
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "addContent",
 *    "server_time": 1548037382973,
 *    "data": [{
 *          "_id": "E1lagiaw",
 *          "name": "NodeJs",
 *          "keywords": "NodeJs,前端开发，全栈开发，前端开发工程师",
 *          "comments": "NodeJs相关技术文档、教程",
 *          "contentTemp": "",
 *          "state": "1",
 *          "__v": 0,
 *          "sortPath": "0,Nycd05pP,E1lagiaw",
 *          "homePage": "NodeJs",
 *          "defaultUrl": "front-development/NodeJs",
 *          "date": "2015-07-05 00:03:15",
 *          "enable": true,
 *          "parentId": "Nycd05pP",
 *          "sortId": 1,
 *          "type": "1",
 *          "uid": 0,
 *          "id": "E1lagiaw"
 *    },
 *    ...
 *    ]
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/contentCategory/getList
 * @apiVersion 1.0.0
 */
router.get('/contentCategory/getList', ContentCategoryApi.list)

// 根据typeId获取相关类别
router.get('/contentCategory/getCurrentCategoriesById', ContentCategoryApi.getCurrentCategoriesById)

// 获取单个类别信息
router.get('/contentCategory/getOne', ContentCategoryApi.getOne)


/**
 * @api {get} /api/v0/contentTag/getList 获取标签列表
 * @apiDescription 获取标签列表
 * @apiName /contentTag/getList
 * @apiGroup Contents
 * @apiParam {string} token 登录返回的token
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 * {
 *  "status": 200,
 *  "message": "communityTags",
 *  "server_time": 1542248521670,
 *  "data": [
 * {
 *      _id: "C41iXBDb5",
 *      name: "即时要闻",
 *      alias: "",
 *      comments: "即时要闻",
 *      __v: 0,
 *      date: "2019-01-04 16:54:41",
 *      id: "C41iXBDb5"
 * },
 * {
 *      _id: "C41iXBDb6",
 *      name: "测试",
 *      alias: "",
 *      comments: "测试",
 *      __v: 0,
 *      date: "2019-01-04 16:54:41",
 *      id: "C41iXBDb6"
 * },
 * {
 *      _id: "ZWlsRWWaL",
 *      name: "主笔专辑",
 *      alias: "",
 *      comments: "主笔专辑",
 *      __v: 0,
 *      date: "2019-01-04 16:54:35",
 *      id: "ZWlsRWWaL"
 * },
 * ...
 *  ]
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/contentTag/getList
 * @apiVersion 1.0.0
 */
router.get('/contentTag/getList', renderUserInfo, ContentTagApi.list)



// 获取系统配置信息
router.get('/systemConfig/getConfig', SystemConfigApi.config)

//---------------------------------------------------------广告相关api

/**
 * @api {get} /api/v0/ads/getOne 查找指定位置 banner
 * @apiDescription 根据ID获取广告(单图或轮播图),包含 发现、热门、推荐、精品、创作者课顶部banner。注意：返回结果中如果 state=true 才显示
 * @apiName /ads/getOne
 * @apiGroup Ads
 * @apiParam {string} name 广告位名称（find/发现，hot/热门，recommend/推荐，boutique/精品，creatorClass/创作者课）
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *  {
 *      "status": 200,
 *      "message": "ads",
 *      "server_time": 1542116428394,
 *      "data": {
 *        "_id": "kYMDJLFDcb",
 *        "name": "creatorClass",
 *        "comments": "创作者课顶部轮播图",
 *        "__v": 0,
 *        "items": [
 *          {
 *            "_id": "MXoW1aBxk",
 *            "title": "",
 *            "link": "https://creatorchain.work",
 *            "appLink": "MXoW1aBxk", // app链接（文章id或普通url）
 *            "appLinkType": "0", // app链接形式 0 文章，1 普通链接
 *            "width": null,
 *            "alt": "发现ads1",
 *            "sImg": "/upload/images/img20181113213438.jpg",
 *            "__v": 0,
 *            "date": "2018-11-13T13:34:56.988Z",
 *            "target": "_blank",
 *            "height": null
 *          },
 *          {
 *            "_id": "h8YuPIf6Aj",
 *            "title": "",
 *            "link": "https://creatorchain.work",
 *            "appLink": "MXoW1aBxk", // app链接（文章id或普通url）
 *            "appLinkType": "0", // app链接形式 0 文章，1 普通链接
 *            "width": null,
 *            "alt": "发现ads2",
 *            "sImg": "/upload/images/img20181113213454.jpg",
 *            "__v": 0,
 *            "date": "2018-11-13T13:34:56.991Z",
 *            "target": "_blank",
 *            "height": null
 *          }
 *        ],
 *        "date": "2018-11-13 21:34:56",
 *        "height": null,
 *        "state": true,
 *        "carousel": true,
 *        "type": "1",
 *        "id": "kYMDJLFDcb"
 *      }
 *  }
 * @apiSampleRequest http://localhost:8080/api/v0/ads/getOne
 * @apiVersion 1.0.0
 */
router.get('/ads/getOne', AdsApi.getOne)



/**
 * @api {get} /api/v0/siteMessage/getList 获取用户消息列表
 * @apiDescription 获取用户消息列表，带分页，包含 赞赏、关注和评论消息，需要登录态
 * @apiName /siteMessage/getList
 * @apiGroup Messages
 * @apiParam {string} current 当前页码
 * @apiParam {string} pageSize 每页记录数
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiParam {string} type 消息类别(1、赞赏 ，2、关注 ，3、评论或回复)
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "getSiteMessages",
 *    "server_time": 1543917647397,
 *    "data": [
 *        {
 *            "_id": "2hl6nHtY0",
 *            "type": "2",
 *            "activeUser": {
 *               "_id": "zwwdJvLmP",
 *               "userName": "doramart",
 *               "phoneNum": 15220064294,
 *               "category": [],
 *               "group": "0",
 *               "logo": "/upload/images/defaultlogo.png",
 *               "date": "2018-11-13 12:09:29",
 *               "comments": "",
 *               "enable": true,
 *               "id": "zwwdJvLmP",
 *               "content_num": 5,
 *               "watch_num": 1,
 *               "follow_num": 0,
 *               "had_followed": false
 *            },
 *            "passiveUser": {
 *               "_id": "yNYHEw3-e",
 *               "userName": "yoooyu",
 *               "category": [
 *                  "yOgDdV8_b"
 *                ],
 *               "group": "1",
 *               "logo": "/upload/images/defaultlogo.png",
 *               "date": "2018-11-17 09:59:52",
 *               "enable": true,
 *               "id": "yNYHEw3-e"
 *            },
 *              "message": {
 *                "_id": "ClvqfXbjw",
 *                "contentId": {
 *                    "_id": "HBFOrbWYz",
 *                    "title": "2018年，你一定被这十首歌逼疯过",
 *                    "date": "2018-12-25 21:50:57",
 *                    "updateDate": "2019-01-01 14:56:34",
 *                    "id": "HBFOrbWYz"
 *                },
 *                "content": "多重评论再一次",
 *                "date": "2019-01-01 14:56:34",
 *                "id": "ClvqfXbjw"
 *              },
 *            "__v": 0,
 *            "isRead": false,
 *            "date": "2018-11-18 16:11:26",
 *            "id": "2hl6nHtY0"
 *        }
 *    ]
 * }
 * @apiSampleRequest http://localhost:8080/api/v0/siteMessage/getList
 * @apiVersion 1.0.0
 */
router.get('/siteMessage/getList', authApiToken, SiteMessageApi.list);



/**
 * @api {get} /api/v0/siteMessage/setHasRead 设置消息为已读
 * @apiDescription 设置消息为已读，包含 赞赏、关注和评论消息；需要登录态
 * @apiName /siteMessage/setHasRead
 * @apiGroup Messages
 * @apiParam {string} ids 消息id,多个id用逗号隔开;传 ids=all 设置所有消息为已读
 * @apiParam {string} type 当ids为all时，传该参数，指定全部设置已读的消息类别
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "设置已读成功",
 *    "server_time": 1542529985218,
 *    "data": {}
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/siteMessage/setHasRead
 * @apiVersion 1.0.0
 */
router.get('/siteMessage/setHasRead', authApiToken, SiteMessageApi.setMessageHasRead)


/**
 * @api {get} /api/v0/siteMessage/getSiteMessageOutline 获取私信概要
 * @apiDescription 获取私信概要(私信内容，关注、评论未读数量和第一条记录)
 * @apiName /siteMessage/getSiteMessageOutline
 * @apiGroup Messages
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *  "status": 200,
 *  "message": "getSiteMessageOutline",
 *  "server_time": 1543904194731,
 *  "data": {
 *    "first_privateLetter": {
 *    "_id": "yvOk_g1y71",
 *    "user": "yNYHEw3-e",
 *    "notify": {   // 私信的具体内容
 *        "_id": "5mCBWXS-B",
 *        "title": "这是一条私信，不要偷偷打开哟。。。",
 *        "content": "<p>这是一条私信，不要偷偷打开哟。。。</p>",
 *        "adminSender": "4JiWCMhzg",
 *        "type": "1",
 *        "__v": 0,
 *        "date": "2018-11-18 16:13:47",
 *        "id": "5mCBWXS-B"
 *      },
 *    "__v": 0,
 *    "date": "2018-11-18 16:13:47",
 *    "isRead": false,
 *    "id": "yvOk_g1y71"
 *    },
 *    "private_no_read_num": 1,
 *    "no_read_good_num": 1,
 *    "first_good_message": { // 被点赞的第一条消息，客户端可以根据 activeUser 组装消息 "activeUser.userName 给你点赞了"
 *         "_id": "Ogg7mFnjS",
 *         "type": "1",
 *         "activeUser": {
 *             "_id": "zwwdJvLmP",
 *             "userName": "doramart",
 *             "date": "2018-12-04 14:16:34",
 *             "id": "zwwdJvLmP"
 *           },
 *         "passiveUser": "yNYHEw3-e",
 *         "content": "Y1XFYKL52",
 *         "__v": 0,
 *         "isRead": false,
 *         "date": "2018-11-18 16:10:44",
 *         "id": "Ogg7mFnjS"
 *    },
 *    "no_read_follow_num": 1,
 *    "first_follow_message": { // 被关注的第一条消息，客户端可以根据 activeUser 组装消息 "activeUser.userName 关注了你"
 *         "_id": "2hl6nHtY0",
 *         "type": "2",
 *         "activeUser": {
 *             "_id": "zwwdJvLmP",
 *             "userName": "doramart",
 *             "date": "2018-12-04 14:16:34",
 *             "id": "zwwdJvLmP"
 *           },
 *         "passiveUser": "yNYHEw3-e",
 *         "__v": 0,
 *         "isRead": false,
 *         "date": "2018-11-18 16:11:26",
 *         "id": "2hl6nHtY0"
 *    },
 *    "no_read_comment_num": 1,
 *    "first_comment_message": { // 评论的第一条消息，客户端可以根据 activeUser 组装消息 "activeUser.userName 给你评论了"
 *         "_id": "iKGCu4EJj",
 *         "type": "3",
 *         "activeUser": {
 *             "_id": "zwwdJvLmP",
 *             "userName": "doramart",
 *             "date": "2018-12-04 14:16:34",
 *             "id": "zwwdJvLmP"
 *           },
 *         "passiveUser": "yNYHEw3-e",
 *         "content": "Y1XFYKL52",
 *         "__v": 0,
 *         "isRead": false,
 *         "date": "2018-11-18 16:11:21",
 *         "id": "iKGCu4EJj"
 *    }
 *  }
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/siteMessage/getSiteMessageOutline
 * @apiVersion 1.0.0
 */
router.get('/siteMessage/getSiteMessageOutline', authApiToken, SiteMessageApi.getSiteMessageOutline)


router.get('/contentTemplate/getDefaultTempInfo', ContentTemplateApi.getDefaultTempInfo)



/**
 * @api {get} /api/v0/system/getAppVersion 获取APP版本信息
 * @apiDescription 获取APP版本信息
 * @apiName /system/getAppVersion
 * @apiGroup System
 * @apiParam {string} versionCode 版本号(传字符串类型整数)
 * @apiParam {string} client 客户端类型(0:安卓，1:ios)
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "get versionData success",
 *    "server_time": 1548049855934,
 *    "data": {
 *         "_id": "H158NRt7Q",
 *         "description": "新增自动更新1",
 *         "title": "有更新啦1",
 *         "url": "/upload/images/apk20180717192615.apk",
 *         "version": "21",
 *         "versionName": "1.1",
 *         "date": "2018-07-16 16:16:17",
 *         "forcibly": true,
 *         "id": "H158NRt7Q"
 *    }
 *}
 * @apiSampleRequest http://localhost:8080/api/v0/system/getAppVersion
 * @apiVersion 1.0.0
 */
router.get('/system/getAppVersion', VersionManageApi.list)


// TODO 私用api 提交合并时留意
router.get('/translate', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  const Axios = require("axios");
  const CryptoJS = require("crypto-js");
  let queryKey = req.query.q || '梨子';
  let from = req.query.from || 'zh';
  let to = req.query.to || 'en';
  // let url = `https://fanyi-api.baidu.com/api/trans/vip/translate`;
  let salt = (new Date).getTime();
  const appid = '20190522000300222';
  let privateKey = '1EcjG7k4uCk8O3IHUpZ8';
  let signStr = `${appid}${queryKey}${salt}${privateKey}`;

  let translateUrl = `https://fanyi-api.baidu.com/api/trans/vip/translate?q=${encodeURIComponent(queryKey)}&from=${from}&to=${to}&appid=${appid}&salt=${salt}&sign=${CryptoJS.MD5(signStr).toString()}`;

  console.log('translateUrl: ', translateUrl);

  Axios.get(translateUrl, {}).then((data) => {
    // console.log('--data--', data.data);
    res.send(data.data)
  }).catch((err) => {
    res.send({
      status: 500,
      message: 'translate error' + err.message
    })
  })
})

module.exports = router