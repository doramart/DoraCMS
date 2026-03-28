'use strict';
const _ = require('lodash');
const xss = require('xss');
const shortid = require('shortid');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const { siteFunc, validatorUtil } = require('../../utils');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const SystemConstants = require('../../constants/SystemConstants');

const RegUserController = {
  checkUserFormData(ctx, fields) {
    let errMsg = '';
    if (fields.id && !ctx.validateId(fields.id)) {
      errMsg = ctx.__('validation.errorParams');
    }
    if (fields.profession && !validator.isNumeric(fields.profession)) {
      errMsg = ctx.__('validation.errorField', [ctx.__('labels.profession')]);
    }
    if (fields.industry && !validator.isNumeric(fields.industry)) {
      errMsg = ctx.__('validation.errorField', [ctx.__('labels.introduction')]);
    }
    if (fields.experience && !validator.isNumeric(fields.experience)) {
      errMsg = ctx.__('validation.errorField', [ctx.__('labels.experience')]);
    }
    if (fields.userName && !validatorUtil.isRegularCharacter(fields.userName)) {
      errMsg = ctx.__('validation.errorField', [ctx.__('user.profile.basic.username')]);
    }
    if (fields.userName && !validator.isLength(fields.userName, 2, 30)) {
      errMsg = ctx.__('validation.rangelength', [ctx.__('user.profile.basic.username'), 2, 12]);
    }
    if (fields.name && !validatorUtil.isRegularCharacter(fields.name)) {
      errMsg = ctx.__('validation.errorField', [ctx.__('user.profile.basic.name')]);
    }
    if (fields.name && !validator.isLength(fields.name, 2, 20)) {
      errMsg = ctx.__('validation.rangelength', [ctx.__('user.profile.basic.name'), 2, 20]);
    }

    if (fields.gender && fields.gender !== '0' && fields.gender !== '1') {
      errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.gender')]);
    }
    if (fields.email && !validatorUtil.checkEmail(fields.email)) {
      errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.email')]);
    }

    if (fields.introduction && !validatorUtil.isRegularCharacter(fields.introduction)) {
      errMsg = ctx.__('validation.errorField', [ctx.__('labels.introduction')]);
    }
    if (fields.introduction && !validator.isLength(fields.introduction, 2, 100)) {
      errMsg = ctx.__('validation.rangelength', [ctx.__('labels.introduction'), 2, 100]);
    }
    if (fields.comments && !validatorUtil.isRegularCharacter(fields.comments)) {
      errMsg = ctx.__('validation.errorField', [ctx.__('user.profile.basic.comments')]);
    }
    if (fields.comments && !validator.isLength(fields.comments, 2, 100)) {
      errMsg = ctx.__('validation.rangelength', [ctx.__('user.profile.basic.comments'), 2, 100]);
    }
    if (errMsg) {
      throw new Error(errMsg);
    }
  },

  // eslint-disable-next-line no-unused-vars
  renderUserList(ctx, userInfo = {}, userList = [], useClient = '2', params = {}) {
    return new Promise(async resolve => {
      try {
        const newUserList = JSON.parse(JSON.stringify(userList));
        for (const userItem of newUserList) {
          // 🔥 标准化查询条件 - 使用操作符格式
          const userContents = await ctx.service.content.find(
            {
              isPaging: '0',
            },
            {
              filters: {
                uAuthor: { $eq: userItem.id },
                state: { $eq: '2' },
              },
              fields: ['id'],
            }
          );
          userItem.content_num = userContents.length;

          // 用户关注数（watchers）和被关注数（followers）
          userItem.watch_num = _.uniq(userItem.watchers).length;
          userItem.follow_num = _.uniq(userItem.followers).length;
          userItem.had_followed = false;

          // 🔥 参与的评论数
          const comments_num = await ctx.service.message.count({
            author: { $eq: userItem.id },
          });
          userItem.comments_num = comments_num;

          // 🔥 重构：使用 ContentInteractionService 获取收藏数量
          const favorites_count = await ctx.service.contentInteraction.count({
            userId: { $eq: userItem.id },
            type: { $eq: 'favorite' },
          });
          userItem.favorites_num = favorites_count;

          // 🔥 重构：只有查询单个用户才查询点赞总数和被踩总数
          // 使用 ContentInteractionService 统计该用户所有文章的点赞和踩数
          if (params.apiName === 'getUserInfoById') {
            let total_likeNum = 0,
              total_despiseNum = 0;

            // 获取该用户所有文章的ID列表
            const contentIds = userContents.map(c => c.id);

            if (contentIds.length > 0) {
              // 🔥 使用 ContentInteractionService 批量统计
              total_likeNum = await ctx.service.contentInteraction.count({
                contentId: { $in: contentIds },
                type: { $eq: 'praise' },
              });

              total_despiseNum = await ctx.service.contentInteraction.count({
                contentId: { $in: contentIds },
                type: { $eq: 'despise' },
              });
            }

            userItem.total_likeNum = total_likeNum;
            userItem.total_despiseNum = total_despiseNum;
          }

          // 检查当前登录用户是否关注了该用户
          if (!_.isEmpty(userInfo)) {
            if (userInfo.watchers.indexOf(userItem.id) >= 0) {
              userItem.had_followed = true;
            }
          }

          siteFunc.clearUserSensitiveInformation(userItem);
        }

        resolve(newUserList);
      } catch (error) {
        ctx.logger.error('[renderUserList] Error:', error);
        resolve(userList);
      }
    });
  },

  async updateUser(ctx) {
    const fields = ctx.request.body;

    RegUserController.checkUserFormData(ctx, fields);

    // 🔥 获取当前登录用户的ID（这是更新当前用户信息的接口，必须先获取ID用于后续验证和更新）
    const targetUserId = ctx.requireCurrentUserId();

    // 🔥 获取当前用户信息，用于对比哪些字段发生了变化
    const currentUser = await ctx.service.user.findOne({ id: targetUserId });
    if (!currentUser) {
      throw RepositoryExceptions.auth.loginRequired();
    }

    // 🔥 业务验证 - 只有当字段真正发生变化时，才检查唯一性
    // 这样可以避免用户更新其他信息时，因为未改变的字段而报重复错误
    if (fields.userName && fields.userName !== currentUser.userName) {
      await ctx.service.user.checkUserNameUnique(fields.userName, targetUserId);
    }

    // ⚠️ 安全提示：邮箱和手机号作为重要的身份标识，不应在此接口随意修改
    // 如需修改邮箱，请使用单独的"更改邮箱"接口，需要验证码验证
    if (fields.email && fields.email !== currentUser.email) {
      throw RepositoryExceptions.business.operationNotAllowed(
        '邮箱是重要的身份标识，无法在此接口修改。如需修改邮箱，请通过"绑定邮箱"功能进行操作。'
      );
    }

    // 🔥 手机号修改同样需要验证
    if (fields.phoneNum && fields.phoneNum !== currentUser.phoneNum) {
      // throw RepositoryExceptions.business.operationNotAllowed(
      //   '手机号是重要的身份标识，无法在此接口修改。如需修改手机号，请通过"绑定手机号"功能进行操作。'
      // );
    }

    const userObj = {};

    if (fields.enable !== 'undefined' && fields.enable !== undefined) {
      userObj.enable = fields.enable;
    }

    if (fields.phoneNum && validatorUtil.checkPhoneNum(fields.phoneNum.toString())) {
      userObj.phoneNum = fields.phoneNum;
    }

    if (fields.userName) {
      userObj.userName = fields.userName;
    }
    if (fields.name) {
      userObj.name = fields.name;
    }
    if (fields.gender) {
      userObj.gender = fields.gender;
    }

    if (fields.logo) {
      userObj.logo = fields.logo;
    }

    if (fields.confirm) {
      userObj.confirm = fields.confirm;
    }
    if (fields.group) {
      userObj.group = fields.group;
    }
    if (fields.category) {
      userObj.category = fields.category;
    }
    if (fields.comments) {
      userObj.comments = xss(fields.comments);
    }
    if (fields.introduction) {
      userObj.introduction = xss(fields.introduction);
    }
    if (fields.company) {
      userObj.company = fields.company;
    }
    if (fields.province) {
      userObj.province = fields.province;
    }
    if (fields.city) {
      userObj.city = fields.city;
    }
    if (fields.birth) {
      // 生日日期不能大于当前时间
      if (new Date(fields.birth).getTime() > new Date().getTime()) {
        throw new Error(ctx.__('validation.errorParams'));
      }
      userObj.birth = fields.birth;
    }
    if (fields.industry) {
      userObj.industry = xss(fields.industry);
    }
    if (fields.profession) {
      userObj.profession = xss(fields.profession);
    }
    if (fields.experience) {
      userObj.experience = xss(fields.experience);
    }
    if (fields.password) {
      userObj.password = fields.password;
    }

    // 使用前面已经获取的 targetUserId 进行更新
    await ctx.service.user.update(targetUserId, userObj);

    ctx.helper.renderSuccess(ctx, {
      data: {},
      message: ctx.__('system.operation.success'),
    });
  },

  async getMyFollowInfos(ctx) {
    const userInfo = ctx.session.user;

    // 🔥 标准化查询条件和选项
    const filters = { id: { $eq: userInfo.id } };
    const options = {
      fields: ['watchers'],
      populate: [
        {
          path: 'watchers',
          select: ['name', 'userName', 'id', 'logo'],
        },
      ],
    };

    const targetUser = await ctx.service.user.findOne(filters, options);
    // console.log('-targetUser----', targetUser)
    const watchersList = targetUser.watchers;

    let watchCreatorContents = [];
    for (const creator of watchersList) {
      const creatorId = creator.id;

      // 🔥 标准化查询条件和选项
      const creatorContents = await ctx.service.content.find(
        {
          isPaging: '0',
        },
        {
          filters: {
            uAuthor: { $eq: creatorId },
            state: { $eq: '2' },
          },
          fields: getContentListFields
            ? getContentListFields(true).split(' ').filter(Boolean)
            : ['id', 'title', 'stitle', 'createdAt'],
          populate: [
            {
              path: 'uAuthor',
              select: ['id', 'userName', 'logo', 'name', 'group'],
            },
          ],
        }
      );
      if (!_.isEmpty(creatorContents)) {
        watchCreatorContents = [].concat(creatorContents);
      }
    }

    const renderData = {
      watchersList,
      watchCreatorContents,
    };

    ctx.helper.renderSuccess(ctx, {
      data: renderData,
    });
  },

  async getUserInfoBySession(ctx) {
    // 使用安全的工具方法获取用户ID
    const userId = ctx.getCurrentUserId();
    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    // 🔥 标准化查询条件和选项
    const filters = { id: { $eq: userId } };
    const options = {
      fields: getAuthUserFields
        ? getAuthUserFields('session').split(' ').filter(Boolean)
        : ['id', 'userName', 'name', 'email', 'logo', 'enable', 'group'],
    };

    const targetUser = await ctx.service.user.findOne(filters, options);

    if (!targetUser) {
      throw RepositoryExceptions.user.notFound(userId);
    }

    ctx.helper.renderSuccess(ctx, {
      data: targetUser,
    });
  },

  // async getUserInfoById(ctx) {
  //   try {
  //     const targetId = ctx.query.id;
  //     const user = ctx.session.user || {};
  //     if (!user || !user.id) {
  //       throw new Error(ctx.__('validation.errorParams'));
  //     }
  //     if (!ctx.validateId(targetId)) {
  //       throw new Error(ctx.__('validation.errorParams'));
  //     }

  //     const targetUser = await ctx.service.user.item( targetId, {
  //       files: getAuthUserFields('base'),
  //     });
  //     const userArr = [].push(targetUser);
  //     const renderUser = await this.renderUserList(ctx, user, userArr, '2', {
  //       apiName: 'getUserInfoById',
  //     });
  //     let userInfo = {};
  //     if (!_.isEmpty(renderUser) && renderUser.length === 1) {
  //       userInfo = renderUser[0];
  //     }

  //     ctx.helper.renderSuccess(ctx, {
  //       data: userInfo,
  //     });
  //   } catch (err) {
  //     ctx.helper.renderFail(ctx, {
  //       message: err,
  //     });
  //   }
  // },

  async bindEmailOrPhoneNum(ctx) {
    const fields = ctx.request.body || {};

    const userInfo = ctx.session.user;
    const bindType = fields.type;
    let errMsg = '';

    if (bindType !== '1' && bindType !== '2') {
      throw RepositoryExceptions.business.invalidParams(ctx.__('validation.errorParams'));
    }

    if (bindType === '1') {
      if (!fields.phoneNum || !validatorUtil.checkPhoneNum(fields.phoneNum.toString())) {
        errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.phoneNum')]);
      }

      if (!fields.countryCode) {
        errMsg = ctx.__('validation.selectNull', [ctx.__('user.center.countryCode')]);
      }

      if (userInfo.phoneNum) {
        throw RepositoryExceptions.user.alreadyInList('绑定手机号', fields.phoneNum);
      }

      let queryUserObj = {
        $or: [
          {
            phoneNum: fields.phoneNum,
          },
          {
            phoneNum: '0' + fields.phoneNum,
          },
        ],
        countryCode: fields.countryCode,
      };

      if (fields.phoneNum.indexOf('0') === 0) {
        queryUserObj = {
          $or: [
            {
              phoneNum: fields.phoneNum,
            },
            {
              phoneNum: fields.phoneNum.substr(1),
            },
          ],
          countryCode: fields.countryCode,
        };
      }

      const userRecords = await ctx.service.user.findOne(queryUserObj);

      if (!_.isEmpty(userRecords)) {
        throw RepositoryExceptions.user.phoneExists(fields.phoneNum);
      }
    } else {
      if (!validatorUtil.checkEmail(fields.email)) {
        errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.email')]);
      }

      if (userInfo.email) {
        throw RepositoryExceptions.user.alreadyInList('绑定邮箱', fields.email);
      }

      const userRecords = await ctx.service.user.findOne({
        email: { $eq: fields.email },
      });
      if (!_.isEmpty(userRecords)) {
        throw RepositoryExceptions.user.emailExists(fields.email);
      }
    }

    const endStr = bindType === '2' ? fields.email : fields.countryCode + fields.phoneNum;

    const currentCode = await this.app.cache.get(
      this.app.config.session_secret + '_sendMessage_tourist_bindAccount_' + endStr
    );

    if (
      !fields.messageCode ||
      !validator.isNumeric(fields.messageCode.toString()) ||
      fields.messageCode.length !== 6 ||
      currentCode !== fields.messageCode
    ) {
      errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.auth.verify.imageCode')]);
    }

    if (errMsg) {
      throw RepositoryExceptions.create.validation(null, errMsg);
    }

    const userObj = {};

    if (bindType === '1') {
      userObj.phoneNum = fields.phoneNum;
      userObj.countryCode = fields.countryCode;
    } else {
      userObj.email = fields.email;
    }

    await ctx.service.user.update(userInfo.id, userObj);

    ctx.helper.clearRedisByType(endStr, '_sendMessage_tourist_bindAccount_');

    ctx.helper.renderSuccess(ctx);
  },

  // 添加私有方法处理 cookie 设置
  _setAuthCookie(app, ctx, token, maxAge = null) {
    // 🔥 检测实际协议：支持通过代理（如 Nginx）的 HTTPS 场景
    // ctx.secure 会检查 X-Forwarded-Proto 头部（如果启用了 proxy: true）
    const isSecure = ctx.secure || ctx.protocol === 'https';

    const cookieOptions = {
      path: '/',
      domain: ctx.hostname,
      signed: true,
      httpOnly: true,
      // 🔥 根据实际协议动态设置，而不是简单依赖环境变量
      secure: isSecure,
      // 🔥 如果不是 HTTPS，使用 lax 而不是 strict，提高兼容性
      sameSite: isSecure ? 'strict' : 'lax',
    };

    // 如果提供了 maxAge，则设置过期时间
    if (maxAge !== null) {
      cookieOptions.maxAge = maxAge;
    }

    ctx.cookies.set('api_' + app.config.auth_cookie_name, token, cookieOptions);
  },

  async loginAction(ctx) {
    const fields = ctx.request.body || {};
    let errMsg = '',
      loginType = fields.loginType || '1'; // 1:手机验证码登录 2:手机号密码登录 3:邮箱密码登录

    // TODO 临时兼容没有改动的APP端
    if (fields.phoneNum && fields.password) {
      loginType = '2';
    }

    if (fields.email && fields.password) {
      loginType = '3';
    }

    if (loginType !== '1' && loginType !== '2' && loginType !== '3' && loginType !== '4') {
      throw RepositoryExceptions.business.invalidParams(ctx.__('user.errors.invalidLoginType'));
    }

    if (loginType === '1' || loginType === '2') {
      if (!fields.phoneNum || !validatorUtil.checkPhoneNum(fields.phoneNum.toString())) {
        errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.phoneNum')]);
      }

      if (!fields.countryCode) {
        errMsg = ctx.__('validation.selectNull', [ctx.__('user.center.countryCode')]);
      }

      if (loginType === '2') {
        if (!validatorUtil.checkPwd(fields.password, 6, 12)) {
          errMsg = ctx.__('validation.rangelength', [ctx.__('user.auth.password.label'), 6, 12]);
        }
      } else if (loginType === '1') {
        const currentCode = await this.app.cache.get(
          this.app.config.session_secret + '_sendMessage_login_' + (fields.countryCode + fields.phoneNum)
        );
        if (
          !fields.messageCode ||
          !validator.isNumeric(fields.messageCode.toString()) ||
          fields.messageCode.length !== 6 ||
          currentCode !== fields.messageCode
        ) {
          errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.auth.verify.imageCode')]);
        }
      }
    } else if (loginType === '3') {
      if (!validatorUtil.checkEmail(fields.email)) {
        errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.email')]);
      }
      if (!validatorUtil.checkPwd(fields.password, 6, 12)) {
        errMsg = ctx.__('validation.rangelength', [ctx.__('user.auth.password.label'), 6, 12]);
      }
    } else if (loginType === '4') {
      if (!validatorUtil.checkEmail(fields.email)) {
        errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.email')]);
      }
      const currentCode = await this.app.cache.get(
        this.app.config.session_secret + '_sendMessage_login_' + fields.email
      );
      if (
        !fields.messageCode ||
        !validator.isNumeric(fields.messageCode.toString()) ||
        fields.messageCode.length !== 6 ||
        currentCode !== fields.messageCode
      ) {
        errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.auth.verify.imageCode')]);
      }
    }

    if (errMsg) {
      throw RepositoryExceptions.create.validation(null, errMsg);
    }

    let queryUserObj = fields.phoneNum
      ? {
          $or: [
            {
              phoneNum: fields.phoneNum,
            },
            {
              phoneNum: '0' + fields.phoneNum,
            },
          ],
          countryCode: fields.countryCode,
        }
      : {};

    if (loginType !== '3' && loginType !== '4' && fields.phoneNum && fields.phoneNum.indexOf('0') === 0) {
      queryUserObj = {
        $or: [
          {
            phoneNum: fields.phoneNum,
          },
          {
            phoneNum: fields.phoneNum.substr(1),
          },
        ],
        countryCode: fields.countryCode,
      };
    }

    const userObj = {};
    if (loginType === '1') {
      _.assign(userObj, queryUserObj);
    } else if (loginType === '2') {
      _.assign(userObj, queryUserObj);
    } else if (loginType === '3') {
      _.assign(userObj, {
        email: fields.email,
      });
    } else if (loginType === '4') {
      _.assign(userObj, {
        email: fields.email,
      });
      queryUserObj = {
        email: fields.email,
      };
    }

    // 初级校验
    const userCount = await ctx.service.user.count(queryUserObj);
    if (userCount > 0 || loginType === '2' || loginType === '3') {
      // 校验登录用户合法性
      const user = await ctx.service.user.findOne(userObj, {
        fields: getAuthUserFields('login').split(' ').filter(Boolean),
        includePassword: true,
      });

      if (_.isEmpty(user)) {
        if (loginType === '2') {
          throw RepositoryExceptions.user.loginFailed();
        } else {
          throw RepositoryExceptions.user.notFound();
        }
      } else {
        if (fields.password !== ctx.helper.decrypt(user.password, this.app.config.encrypt_key)) {
          throw RepositoryExceptions.user.invalidCredentials();
        }
      }
      if (!user.enable) {
        throw RepositoryExceptions.user.disabled();
      }

      if (!user.loginActive) {
        await ctx.service.user.update(user.id, {
          loginActive: true,
        });
      }

      const renderUser = JSON.parse(JSON.stringify(user));

      // 针对 App 端同时创建 Token
      renderUser.token = jwt.sign(
        {
          userId: user.id,
        },
        this.app.config.jwtSecret,
        {
          expiresIn: this.app.config.jwtExpiresIn,
        }
      );

      // 将cookie存入缓存
      RegUserController._setAuthCookie(this.app, ctx, renderUser.token, this.app.config.userMaxAge);

      // 重置验证码
      const endStr = loginType === '3' ? fields.email : fields.countryCode + fields.phoneNum;
      ctx.helper.clearRedisByType(endStr, '_sendMessage_login_');

      ctx.helper.sendMessageToClient(ctx, 'reguser', ctx.__('user.messages.userLoggedIn', [renderUser.userName]));

      // 记录登录日志（统一日志系统）
      await ctx.service.systemOptionLog
        .logUserLogin({
          id: user.id,
          userName: user.userName,
          type: 'user',
        })
        .catch(err => {
          console.error('[LoginLog] Failed to log:', err.message);
        });

      // 🔥 触发 Webhook 事件：user.login
      try {
        await ctx.service.webhook.triggerEvent('user.login', {
          userId: user.id,
          userName: user.userName,
          email: user.email,
          phoneNum: user.phoneNum,
          loginAt: new Date(),
          loginType,
        });
      } catch (error) {
        // Webhook 触发失败不应影响业务逻辑
        ctx.logger.error('[User] Failed to trigger webhook for user.login:', error);
      }

      // console.log('--111---',renderUser)
      ctx.helper.renderSuccess(ctx, {
        data: renderUser,
        message: ctx.__('validation.userLoginOk'),
      });
    } else {
      console.log('No user,create new User');
      // 没有该用户数据，新建该用户
      const createUserObj = {
        group: '0',
        creativeRight: false,
        loginActive: true,
        birth: '1770-01-01',
        enable: true,
      };

      if (loginType === '1') {
        createUserObj.phoneNum = fields.phoneNum;
        createUserObj.countryCode = fields.countryCode;
        createUserObj.userName = fields.phoneNum;
      } else if (loginType === '4') {
        createUserObj.email = fields.email;
        createUserObj.userName = fields.email;
      }

      const currentUser = await ctx.service.user.create(createUserObj);
      const newUser = await ctx.service.user.findOne(
        { id: { $eq: currentUser.id } },
        {
          fields: getAuthUserFields('login').split(' ').filter(Boolean),
        }
      );
      const renderUser = JSON.parse(JSON.stringify(newUser));

      renderUser.token = jwt.sign(
        {
          userId: renderUser.id,
        },
        this.app.config.jwtSecret,
        {
          expiresIn: this.app.config.jwtExpiresIn,
        }
      );
      RegUserController._setAuthCookie(this.app, ctx, renderUser.token, this.app.config.userMaxAge);

      // 重置验证码
      const endStr = loginType === '3' ? fields.email : fields.countryCode + fields.phoneNum;
      ctx.helper.clearRedisByType(endStr, '_sendMessage_login_');

      // 记录登录日志（新用户注册并登录）
      await ctx.service.systemOptionLog
        .logUserLogin({
          id: currentUser.id,
          userName: renderUser.userName,
          type: 'user',
        })
        .catch(err => {
          console.error('[LoginLog] Failed to log:', err.message);
        });

      // 🔥 触发 Webhook 事件：user.login（新用户首次登录）
      try {
        await ctx.service.webhook.triggerEvent('user.login', {
          userId: currentUser.id,
          userName: renderUser.userName,
          email: renderUser.email,
          phoneNum: renderUser.phoneNum,
          loginAt: new Date(),
          loginType,
          isFirstLogin: true,
        });
      } catch (error) {
        // Webhook 触发失败不应影响业务逻辑
        ctx.logger.error('[User] Failed to trigger webhook for user.login:', error);
      }

      ctx.helper.renderSuccess(ctx, {
        data: renderUser,
        message: ctx.__('validation.userLoginOk'),
      });
    }
  },

  async touristLoginAction(ctx) {
    const fields = ctx.request.body || {};
    const userCode = fields.userCode;

    if (!userCode) {
      throw RepositoryExceptions.business.invalidParams(ctx.__('validation.errorParams'));
    }

    const renderCode = ctx.helper.encrypt(userCode, this.app.config.encrypt_key);

    if (!renderCode) {
      throw RepositoryExceptions.business.invalidParams(ctx.__('validation.errorParams'));
    }

    const targetUser = await ctx.service.user.findOne({
      deviceId: { $eq: renderCode },
    });

    if (!_.isEmpty(targetUser)) {
      console.log('get old tourist User');

      if (!targetUser.enable) {
        throw RepositoryExceptions.user.disabled();
      }

      const renderUser = JSON.parse(JSON.stringify(targetUser));

      // 针对 App 端同时创建 Token
      renderUser.token = jwt.sign(
        {
          userId: targetUser.id,
        },
        this.app.config.jwtSecret,
        {
          expiresIn: this.app.config.jwtExpiresIn,
        }
      );

      RegUserController._setAuthCookie(this.app, ctx, renderUser.token, this.app.config.userMaxAge);

      ctx.helper.renderSuccess(ctx, {
        data: renderUser,
        message: ctx.__('validation.userLoginOk'),
      });
    } else {
      console.log('create new tourist User');
      // 没有该用户数据，新建该用户
      const createUserObj = {
        userName: renderCode,
        deviceId: renderCode,
        group: '0',
        creativeRight: false,
        loginActive: true,
        birth: '1770-01-01',
        enable: true,
      };

      const currentUser = await ctx.service.user.create(createUserObj);

      const newUser = await ctx.service.user.findOne(
        { id: { $eq: currentUser.id } },
        {
          fields: getAuthUserFields('login').split(' ').filter(Boolean),
        }
      );
      const renderUser = JSON.parse(JSON.stringify(newUser));

      renderUser.token = jwt.sign(
        {
          userId: renderUser.id,
        },
        this.app.config.jwtSecret,
        {
          expiresIn: this.app.config.jwtExpiresIn,
        }
      );

      RegUserController._setAuthCookie(this.app, ctx, renderUser.token, this.app.config.userMaxAge);

      ctx.helper.renderSuccess(ctx, {
        data: renderUser,
        message: ctx.__('validation.userLoginOk'),
      });
    }
  },

  async regAction(ctx) {
    const fields = ctx.request.body || {};
    let errMsg = '';
    const regType = fields.regType || '1'; // 1:手机号注册  2:邮箱注册

    if (regType !== '1' && regType !== '2') {
      throw RepositoryExceptions.business.invalidParams(ctx.__('validation.errorParams'));
    }

    if (regType === '1') {
      if (!fields.phoneNum || !validatorUtil.checkPhoneNum(fields.phoneNum.toString())) {
        errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.phoneNum')]);
      }

      if (!fields.countryCode) {
        errMsg = ctx.__('validation.selectNull', [ctx.__('user.center.countryCode')]);
      }
    } else if (regType === '2') {
      if (!validatorUtil.checkEmail(fields.email)) {
        errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.email')]);
      }
    }

    const endStr = regType === '1' ? fields.countryCode + fields.phoneNum : fields.email;
    const currentCode = await this.app.cache.get(this.app.config.session_secret + '_sendMessage_reg_' + endStr);

    if (
      !validator.isNumeric(fields.messageCode.toString()) ||
      fields.messageCode.length !== 6 ||
      currentCode !== fields.messageCode
    ) {
      errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.auth.verify.imageCode')]);
    }

    if (fields.userName && !validator.isLength(fields.userName, 2, 12)) {
      errMsg = ctx.__('validation.rangelength', [ctx.__('user.profile.basic.username'), 2, 12]);
    }

    if (fields.userName && !validatorUtil.isRegularCharacter(fields.userName)) {
      errMsg = ctx.__('validation.errorField', [ctx.__('user.profile.basic.username')]);
    }

    if (!validatorUtil.checkPwd(fields.password, 6, 12)) {
      errMsg = ctx.__('validation.rangelength', [ctx.__('user.auth.password.label'), 6, 12]);
    }

    if (errMsg) {
      throw RepositoryExceptions.create.validation(errMsg);
    }

    const userObj = {
      userName: fields.userName || fields.phoneNum,
      countryCode: fields.countryCode,
      logo: fields.logo,
      phoneNum: fields.phoneNum,
      email: fields.email,
      group: '0',
      creativeRight: false,
      password: fields.password,
      loginActive: false,
      enable: true,
    };

    let queryUserObj = {};
    if (regType === '1') {
      queryUserObj = {
        $or: [
          {
            phoneNum: fields.phoneNum,
          },
          {
            phoneNum: '0' + fields.phoneNum,
          },
        ],
      };

      if (fields.phoneNum.indexOf('0') === 0) {
        queryUserObj = {
          $or: [
            {
              phoneNum: fields.phoneNum,
            },
            {
              phoneNum: fields.phoneNum.substr(1),
            },
          ],
        };
      }
    } else if (regType === '2') {
      queryUserObj = {
        email: fields.email,
      };
      userObj.userName = userObj.userName || fields.email;
    }

    const user = await ctx.service.user.findOne(queryUserObj);

    if (!_.isEmpty(user)) {
      if (regType === '1') {
        throw RepositoryExceptions.user.phoneExists(fields.phoneNum);
      } else {
        throw RepositoryExceptions.user.emailExists(fields.email);
      }
    } else {
      const endUser = await ctx.service.user.create(userObj);

      ctx.session.user = await ctx.service.user.findOne(
        { id: { $eq: endUser.id } },
        {
          fields: getAuthUserFields('session').split(' ').filter(Boolean),
        }
      );

      // 重置验证码
      ctx.helper.clearRedisByType(endStr, '_sendMessage_reg_');

      // 记录操作日志（用户注册）
      await ctx.service.systemOptionLog
        .logOperation({
          module: 'user',
          action: 'register',
          resource_type: 'user',
          resource_id: endUser.id,
          new_value: JSON.stringify({
            userName: endUser.userName,
            phoneNum: endUser.phoneNum,
            email: endUser.email,
          }),
          logs: ctx.__('logs.user.register', [userObj.userName]),
        })
        .catch(err => {
          console.error('[OperationLog] Failed to log:', err.message);
        });

      ctx.helper.renderSuccess(ctx, {
        message: ctx.__('validation.userRegOk'),
      });
    }
  },

  async checkPhoneNumExist(ctx) {
    const phoneNum = ctx.query.phoneNum || '';
    const countryCode = ctx.query.countryCode || '';
    let errMsg = '';

    if (!phoneNum || !validatorUtil.checkPhoneNum(phoneNum.toString())) {
      errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.phoneNum')]);
    }

    if (!validator.isNumeric(countryCode.toString())) {
      errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.center.countryCode')]);
    }

    if (errMsg) {
      throw RepositoryExceptions.create.validation(errMsg);
    }

    let queryUserObj = {
      $or: [
        {
          phoneNum,
        },
        {
          phoneNum: '0' + phoneNum,
        },
      ],
      countryCode,
    };

    if (phoneNum.indexOf('0') === 0) {
      queryUserObj = {
        $or: [
          {
            phoneNum,
          },
          {
            phoneNum: phoneNum.substr(1),
          },
        ],
        countryCode,
      };
    }

    const targetUser = await ctx.service.user.findOne(queryUserObj);
    let checkState = false;
    if (!_.isEmpty(targetUser)) {
      checkState = true;
    }

    ctx.helper.renderSuccess(ctx, {
      data: {
        checkState,
      },
    });
  },

  async checkHadSetLoginPassword(ctx) {
    const userInfo = ctx.session.user;
    const targetUser = await ctx.service.user.findOne({
      id: { $eq: userInfo.id },
    });
    let checkState = false;
    if (!_.isEmpty(targetUser) && targetUser.password) {
      checkState = true;
    }

    ctx.helper.renderSuccess(ctx, {
      data: {
        checkState,
      },
    });
  },

  async logOut(ctx) {
    const userId = ctx.session.user?.id;
    const userName = ctx.session.user?.userName;

    // 记录登出日志（在清除 session 前）
    if (userId) {
      await ctx.service.systemOptionLog
        .logUserLogout({
          id: userId,
          userName,
          type: 'user',
        })
        .catch(err => {
          console.error('[LogoutLog] Failed to log:', err.message);
        });

      // 🔥 触发 Webhook 事件：user.logout
      try {
        await ctx.service.webhook.triggerEvent('user.logout', {
          userId,
          userName,
          logoutAt: new Date(),
        });
      } catch (error) {
        // Webhook 触发失败不应影响业务逻辑
        ctx.logger.error('[User] Failed to trigger webhook for user.logout:', error);
      }
    }

    ctx.session = null;
    RegUserController._setAuthCookie(this.app, ctx, null, 0);
    ctx.helper.renderSuccess(ctx, {
      message: ctx.__('validation.userLogoutOk'),
    });
  },

  /**
   * 🔥 新增：刷新 Token
   * POST /api/v1/auth/refresh
   * @param ctx
   */
  async refreshToken(ctx) {
    // 🔥 检查用户登录状态
    const userInfo = ctx.session.user;
    if (!userInfo) {
      throw RepositoryExceptions.auth.loginRequired();
    }

    // 🔥 生成新的 Token
    const newToken = jwt.sign(
      {
        userId: userInfo.id,
        userName: userInfo.userName,
        email: userInfo.email,
      },
      this.app.config.jwtSecret,
      {
        expiresIn: this.app.config.userMaxAge,
      }
    );

    // 🔥 更新 Cookie
    RegUserController._setAuthCookie(this.app, ctx, newToken, this.app.config.userMaxAge);

    ctx.helper.renderSuccess(ctx, {
      data: {
        token: newToken,
        expiresIn: this.app.config.userMaxAge,
      },
      message: 'Token 刷新成功',
    });
  },

  async sentConfirmEmail(ctx) {
    const fields = ctx.request.body || {};
    const targetEmail = fields.email;
    // 获取当前发送邮件的时间
    const retrieveTime = new Date().getTime();
    if (!validator.isEmail(targetEmail)) {
      throw RepositoryExceptions.user.emailInvalid(targetEmail);
    } else {
      const user = await ctx.service.user.findOne(
        { email: { $eq: targetEmail } },
        {
          fields: ['userName', 'email', 'password', 'id'],
        }
      );
      if (!_.isEmpty(user) && user.id) {
        await ctx.service.user.update(user.id, {
          retrieve_time: retrieveTime,
        });
        // 发送通知邮件给用户
        try {
          await ctx.service.mailTemplate.sendEmail(SystemConstants.MAIL.BUSINESS_TYPES.PASSWORD_RESET, {
            email: targetEmail,
            userName: user.userName,
            password: user.password,
          });
        } catch (emailError) {
          // 邮件发送失败不影响密码重置流程
          console.warn(ctx.__('user.warnings.resetPasswordEmailFailed', [emailError.message]));
        }

        ctx.helper.renderSuccess(ctx, {
          message: ctx.__('email.resetPwdSuccess'),
        });
      } else {
        throw RepositoryExceptions.user.notFound();
      }
    }
  },

  async reSetPass(ctx) {
    const params = ctx.query;
    const tokenId = params.key;
    const keyArr = ctx.helper.getKeyArrByTokenId(tokenId);

    if (keyArr && validator.isEmail(keyArr[1])) {
      try {
        const user = await ctx.service.user.findOne(
          { email: { $eq: keyArr[1] } },
          {
            fields: ['email', 'password', 'id', 'retrieve_time'],
          }
        );
        // console.log('---user---', user)
        // console.log('---keyArr---', keyArr)
        if (!_.isEmpty(user) && user.id) {
          ctx.params = {
            title: '找回密码',
            des: '找回密码',
          };
          // const siteInfo = await ctx.getSiteInfo();
          // const staticThemePath = this.app.config.static.prefix + '/themes/' + defaultTemp.alias;
          if (user.password === keyArr[0] && keyArr[2] === this.app.config.session_secret) {
            //  校验链接是否过期
            const now = new Date().getTime();
            const oneDay = 1000 * 60 * 60 * 24;
            if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
              throw RepositoryExceptions.user.notFound();
            } else {
              await ctx.render('user-center/index.html', { tokenId });
            }
          } else {
            throw RepositoryExceptions.user.notFound();
          }
        } else {
          ctx.helper.renderFail(ctx, {
            message: ctx.__('email.noEmail'),
          });
        }
      } catch (err) {
        ctx.helper.renderFail(ctx, {
          message: err,
        });
      }
    } else {
      ctx.helper.renderFail(ctx, {
        message: ctx.__('email.noEmail'),
      });
    }
  },

  async resetMyPassword(ctx) {
    try {
      const fields = ctx.request.body || {};
      const phoneNum = fields.phoneNum;
      const countryCode = fields.countryCode;
      const messageCode = fields.messageCode;

      const type = fields.type || '1';
      let errMsg = '';

      if (type !== '1' && type !== '2') {
        throw new Error(ctx.__('validation.errorParams'));
      }

      if (type === '1') {
        if (!phoneNum || !validator.isNumeric(phoneNum.toString())) {
          throw new Error(ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.phoneNum')]));
        }

        if (!countryCode) {
          errMsg = ctx.__('validation.selectNull', [ctx.__('user.center.countryCode')]);
        }
      } else if (type === '2') {
        if (!validatorUtil.checkEmail(fields.email)) {
          throw new Error(ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.email')]));
        }
      }

      const endStr = type === '1' ? fields.countryCode + fields.phoneNum : fields.email;
      const currentCode = await this.app.cache.get(
        this.app.config.session_secret + '_sendMessage_resetPassword_' + endStr
      );

      if (
        !validator.isNumeric(messageCode.toString()) ||
        messageCode.length !== 6 ||
        currentCode !== fields.messageCode
      ) {
        errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.auth.verify.imageCode')]);
      }

      if (!fields.password) {
        errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.auth.password.label')]);
      }

      if (errMsg) {
        throw new Error(errMsg);
      }

      let queryUserObj = {
        $or: [
          {
            phoneNum: fields.phoneNum,
          },
          {
            phoneNum: '0' + fields.phoneNum,
          },
        ],
        countryCode: fields.countryCode,
      };

      if (type === '1') {
        if (fields.phoneNum.indexOf('0') === 0) {
          queryUserObj = {
            $or: [
              {
                phoneNum: fields.phoneNum,
              },
              {
                phoneNum: fields.phoneNum.substr(1),
              },
            ],
            countryCode: fields.countryCode,
          };
        }
      } else if (type === '2') {
        queryUserObj = {
          email: fields.email,
        };
      }

      const targetUser = await ctx.service.user.findOne(queryUserObj);

      if (!_.isEmpty(targetUser)) {
        await ctx.service.user.update(targetUser.id, {
          password: fields.password,
        });

        // 重置验证码
        ctx.helper.clearRedisByType(endStr, '_sendMessage_resetPassword_');

        ctx.helper.renderSuccess(ctx, {
          message: ctx.__('api.response.success', [ctx.__('user.auth.password.modify')]),
        });
      } else {
        throw new Error(ctx.__('email.errorMessage'));
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  // web 端找回密码
  async updateNewPsd(ctx) {
    const fields = ctx.request.body || {};
    let errMsg = '';
    if (!fields.tokenId) {
      errMsg = 'token is null';
    }

    if (!fields.password) {
      errMsg = 'password is null';
    }

    if (fields.password !== fields.confirmPassword) {
      errMsg = ctx.__('validation.errorPassAtypism');
    }

    if (errMsg) {
      throw new Error(errMsg);
    } else {
      const keyArr = ctx.helper.getKeyArrByTokenId(fields.tokenId);
      if (keyArr && validator.isEmail(keyArr[1])) {
        try {
          const user = await ctx.service.user.findOne(
            { email: { $eq: keyArr[1] } },
            {
              fields: ['userName', 'email', 'password', 'id'],
            }
          );
          if (!_.isEmpty(user) && user.id) {
            if (user.password === keyArr[0] && keyArr[2] === this.app.config.session_secret) {
              await ctx.service.user.update(user.id, {
                password: fields.password,
                retrieve_time: null,
              });
              ctx.helper.renderSuccess(ctx, {
                message: ctx.__('api.response.success', [ctx.__('user.auth.password.modify')]),
              });
            } else {
              throw new Error(ctx.__('validation.errorParams'));
            }
          } else {
            throw new Error(ctx.__('validation.errorParams'));
          }
        } catch (error) {
          ctx.helper.renderFail(ctx, {
            message: ctx.__('validation.errorParams'),
          });
        }
      } else {
        ctx.helper.renderFail(ctx, {
          message: ctx.__('validation.errorParams'),
        });
      }
    }
  },

  async modifyMyPsd(ctx) {
    try {
      const fields = ctx.request.body || {};

      let errMsg = '';
      const userInfo = ctx.session.user || {};

      if (!fields.oldPassword) {
        errMsg = 'oldPassword is null';
      }

      if (!fields.password) {
        errMsg = 'password is null';
      }

      if (errMsg) {
        throw new Error(ctx.__('validation.errorParams'));
      }

      const targetUser = await ctx.service.user.findOne(
        { id: { $eq: userInfo.id } },
        {
          fields: ['id', 'password'],
        }
      );

      if (!_.isEmpty(targetUser)) {
        if (fields.oldPassword !== ctx.helper.decrypt(targetUser.password, this.app.config.encrypt_key)) {
          throw new Error(ctx.__('email.errorMessage'));
        }

        await ctx.service.user.update(userInfo.id, {
          password: fields.password,
        });

        // 记录操作日志（修改密码）
        await ctx.service.systemOptionLog
          .logOperation({
            module: 'user',
            action: 'update_password',
            resource_type: 'user',
            resource_id: userInfo.id,
            logs: `用户修改密码: ${userInfo.userName}`,
          })
          .catch(err => {
            console.error('[OperationLog] Failed to log:', err.message);
          });

        ctx.helper.renderSuccess(ctx, {
          message: ctx.__('api.response.success', [ctx.__('user.auth.password.modify')]),
        });
      } else {
        throw new Error(ctx.__('email.errorMessage'));
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  /**
   * 🔥 优化版：添加用户标签
   * @param ctx
   * @description 支持 RESTful 路由：POST /api/v1/users/:userId/tags
   */
  async addTags(ctx) {
    const targetUser = ctx.session.user;
    const userInfo = await ctx.service.user.findOne(
      { id: { $eq: targetUser.id } },
      {
        fields: ['watchTags'],
      }
    );
    // 🔥 RESTful: 优先使用路径参数中的 userId，也兼容查询参数 tagId
    const tagId = ctx.params.userId || ctx.query.tagId;
    const followState = ctx.query.type;
    if (!ctx.validateId(tagId)) {
      throw RepositoryExceptions.business.invalidParams(ctx.__('validation.errorParams'));
    }

    const targetTag = await ctx.service.contentTag.item({
      query: {
        id: tagId,
      },
    });
    if (_.isEmpty(targetTag)) {
      throw RepositoryExceptions.business.invalidParams(ctx.__('validation.errorParams'));
    }
    const oldWatchTag = userInfo.watchTags || [];
    const oldWatchTagArr = _.concat([], oldWatchTag);
    if (oldWatchTagArr.indexOf(tagId) >= 0 && followState === '1') {
      throw RepositoryExceptions.user.alreadyInList('关注标签', tagId);
    } else {
      if (followState === '1') {
        // oldWatchTagArr.push(tagId);
        await ctx.service.user.addToSet(userInfo.id, {
          watchTags: tagId,
        });
      } else if (followState === '0') {
        // oldWatchTagArr = _.filter(oldWatchTagArr, (item) => {
        //     return item !== tagId;
        // })
        await ctx.service.user.pull(userInfo.id, {
          watchTags: tagId,
        });
      } else {
        throw RepositoryExceptions.business.invalidParams(ctx.__('validation.errorParams'));
      }
      // oldWatchTagArr = _.uniq(oldWatchTagArr);

      // await ctx.service.user.update( userInfo.id, {
      //     watchTags: oldWatchTagArr
      // });

      ctx.helper.renderSuccess(ctx);
    }
  },

  /**
   * 🔥 优化版：关注创作者
   * @param ctx
   * @description 支持 RESTful 路由：POST /api/v1/users/:userId/following/:creatorId
   */
  async followCreator(ctx) {
    try {
      const userInfo = ctx.session.user;
      const userId = userInfo.id;
      // 🔥 RESTful: 优先使用路径参数中的 creatorId
      const creatorIds = ctx.params.creatorId || ctx.query.creatorId;
      const creatorFollowState = ctx.query.followState || 'in';

      if (!creatorIds) {
        throw new Error(ctx.__('validation.errorParams'));
      }

      const creatorIdArr = creatorIds.split(',');
      const targetWatcher = await ctx.service.user.findOne({
        id: { $eq: userId },
      });
      for (const creatorId of creatorIdArr) {
        if (!ctx.validateId(creatorId)) {
          throw new Error(ctx.__('validation.errorParams'));
        }

        if (creatorId === userId) {
          throw new Error(ctx.__('user.action.tips.subscribeSelf'));
        }
        // console.log('---creatorId---', creatorId);
        const targetCreatorFollow = await ctx.service.user.findOne({
          id: { $eq: creatorId },
        });
        // console.log('---targetCreatorFollow---', targetCreatorFollow);
        if (_.isEmpty(targetCreatorFollow)) {
          throw new Error(ctx.__('validation.errorParams'));
        }

        const userWatcherArr = _.concat([], targetWatcher.watchers);
        // const creatorFollowersArr = _.concat([], targetCreatorFollow.followers);

        if (userWatcherArr.indexOf(userId) >= 0 && creatorFollowState === 'in') {
          throw new Error(ctx.__('validation.errorRepost'));
        } else {
          if (creatorFollowState === 'in') {
            // 记录本人主动关注
            await ctx.service.user.addToSet(userId, {
              watchers: targetCreatorFollow.id,
            });
            // 记录会员被关注
            await ctx.service.user.addToSet(targetCreatorFollow.id, {
              followers: userId,
            });
          } else if (creatorFollowState === 'out') {
            // 记录本人主动取消关注
            await ctx.service.user.pull(userId, {
              watchers: targetCreatorFollow.id,
            });
            // 记录会员被取消关注
            await ctx.service.user.pull(targetCreatorFollow.id, {
              followers: userId,
            });
          } else {
            throw new Error(ctx.__('validation.errorParams'));
          }

          // 发送关注消息
          if (creatorFollowState === 'in') {
            siteFunc.addSiteMessage('2', userInfo, targetCreatorFollow.id);
          }
        }

        ctx.helper.renderSuccess(ctx, {
          data: ctx.__('api.response.success', [
            ctx.__(creatorFollowState === 'in' ? 'user.action.tips.addCreator' : 'user.action.tips.unsubscribeCreator'),
          ]),
        });
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async sendVerificationCode(ctx) {
    try {
      const fields = ctx.request.body || {};
      let phoneNum = fields.phoneNum;
      const email = fields.email;
      let countryCode = fields.countryCode;
      const messageType = fields.messageType;
      const sendType = fields.sendType || '1'; // 1: 短信验证码  2:邮箱验证码

      // 针对管理员
      const userName = fields.userName;
      const password = fields.password;

      let cacheKey = '',
        errMsg = '';

      // 管理员登录
      if (messageType === '5') {
        if (!userName || !password) {
          throw new Error(ctx.__('system.notice.noPower'));
        }

        const targetAdminUser = await ctx.service.admin.findOne({
          userName,
          password,
        });

        if (!_.isEmpty(targetAdminUser)) {
          phoneNum = targetAdminUser.phoneNum;
          countryCode = targetAdminUser.countryCode;
        } else {
          throw new Error(ctx.__('system.notice.noPower'));
        }
      } else {
        if (sendType === '1') {
          if (!phoneNum || !validator.isNumeric(phoneNum.toString())) {
            errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.phoneNum')]);
          }

          if (!fields.countryCode) {
            errMsg = ctx.__('validation.selectNull', [ctx.__('user.center.countryCode')]);
          }
        } else if (sendType === '2') {
          if (!validatorUtil.checkEmail(fields.email)) {
            errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.profile.basic.email')]);
          }
        }
      }

      if (!messageType) {
        errMsg = ctx.__('validation.errorParams');
      }

      if (errMsg) {
        throw new Error(errMsg);
      }

      // 生成短信验证码
      const currentStr = siteFunc.randomString(6, '123456789');

      if (messageType === '0') {
        // 注册验证码
        cacheKey = '_sendMessage_reg_';
      } else if (messageType === '1') {
        // 登录获取验证码
        cacheKey = '_sendMessage_login_';
      } else if (messageType === '2') {
        // 忘记资金密码获取验证码
        cacheKey = '_sendMessage_reSetFunPassword_';
      } else if (messageType === '3') {
        // 忘记登录密码找回
        cacheKey = '_sendMessage_resetPassword_';
      } else if (messageType === '4') {
        // 身份认证
        cacheKey = '_sendMessage_identity_verification_';
      } else if (messageType === '5') {
        // 管理员登录
        cacheKey = '_sendMessage_adminUser_login_';
      } else if (messageType === '6') {
        // 游客绑定邮箱或手机号
        cacheKey = '_sendMessage_tourist_bindAccount_';
      } else {
        throw new Error(ctx.__('validation.errorParams'));
      }

      const endStr = sendType === '1' ? countryCode + phoneNum : email;
      const currentKey = this.app.config.session_secret + cacheKey + endStr;
      // console.log(currentStr, '--currentKey--', currentKey)
      ctx.helper.setMemoryCache(currentKey, currentStr, 1000 * 60 * 10); // 验证码缓存10分钟

      // 验证码加密
      const renderCode = ctx.helper.encrypt(currentStr, this.app.config.encrypt_key);
      console.log('renderCode: ', renderCode);

      if (sendType === '1') {
        // 发送短消息
        process.env.NODE_ENV === 'production' &&
          siteFunc.sendTellMessagesByPhoneNum(countryCode, phoneNum, currentStr.toString());
      } else if (sendType === '2') {
        // 发送通知邮件给用户
        try {
          await ctx.service.mailTemplate.sendEmail(SystemConstants.MAIL.BUSINESS_TYPES.VERIFICATION_CODE, {
            email,
            msgCode: currentStr,
          });
        } catch (emailError) {
          // 邮件发送失败不影响验证码发送流程
          console.warn(ctx.__('user.warnings.verificationEmailFailed', [emailError.message]));
        }
      } else {
        throw new Error(ctx.__('validation.errorParams'));
      }

      ctx.helper.renderSuccess(ctx, {
        message: ctx.__('api.response.success', [ctx.__('user.action.tips.sendMessage')]),
        data: {
          messageCode: renderCode,
        },
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async despiseContent(ctx) {
    try {
      const userInfo = ctx.session.user;
      const userId = userInfo.id;
      const contentId = ctx.query.contentId;
      const despiseState = ctx.query.despiseState || 'in';

      if (!ctx.validateId(contentId)) {
        throw new Error(ctx.__('validation.errorParams'));
      }

      const targetContent = await ctx.service.content.findOne({
        id: { $eq: contentId },
        state: { $eq: '2' },
      });

      if (_.isEmpty(targetContent)) {
        throw new Error(ctx.__('validation.errorParams'));
      }

      if (despiseState === 'in') {
        const result = await ctx.service.user.despiseContent(userId, contentId);
        if (!result.success) throw new Error(result.message);
      } else if (despiseState === 'out') {
        const result = await ctx.service.user.undespiseContent(userId, contentId);
        if (!result.success) throw new Error(result.message);
      } else {
        throw new Error(ctx.__('validation.errorParams'));
      }

      ctx.helper.renderSuccess(ctx, {
        message: ctx.__('api.response.success', [ctx.__('user.action.types.despise')]),
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err.message || err,
      });
    }
  },
};

module.exports = RegUserController;
