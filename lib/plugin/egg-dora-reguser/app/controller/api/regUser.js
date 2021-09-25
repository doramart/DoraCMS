'use strict';
const _ = require('lodash');
const xss = require('xss');
const shortid = require('shortid');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const { siteFunc, validatorUtil } = require('../../utils');

const RegUserController = {
  checkUserFormData(ctx, fields) {
    let errMsg = '';
    if (fields._id && !checkCurrentId(fields._id)) {
      errMsg = ctx.__('validate_error_params');
    }
    if (fields.profession && !validator.isNumeric(fields.profession)) {
      errMsg = ctx.__('validate_error_field', [ctx.__('label_profession')]);
    }
    if (fields.industry && !validator.isNumeric(fields.industry)) {
      errMsg = ctx.__('validate_error_field', [ctx.__('label_introduction')]);
    }
    if (fields.experience && !validator.isNumeric(fields.experience)) {
      errMsg = ctx.__('validate_error_field', [ctx.__('label_experience')]);
    }
    if (fields.userName && !validatorUtil.isRegularCharacter(fields.userName)) {
      errMsg = ctx.__('validate_error_field', [ctx.__('label_user_userName')]);
    }
    if (fields.userName && !validator.isLength(fields.userName, 2, 30)) {
      errMsg = ctx.__('validate_rangelength', [
        ctx.__('label_user_userName'),
        2,
        12,
      ]);
    }
    if (fields.name && !validatorUtil.isRegularCharacter(fields.name)) {
      errMsg = ctx.__('validate_error_field', [ctx.__('label_name')]);
    }
    if (fields.name && !validator.isLength(fields.name, 2, 20)) {
      errMsg = ctx.__('validate_rangelength', [ctx.__('label_name'), 2, 20]);
    }

    if (fields.gender && fields.gender !== '0' && fields.gender !== '1') {
      errMsg = ctx.__('validate_inputCorrect', [ctx.__('lc_gender')]);
    }
    if (fields.email && !validatorUtil.checkEmail(fields.email)) {
      errMsg = ctx.__('validate_inputCorrect', [ctx.__('label_user_email')]);
    }

    if (
      fields.introduction &&
      !validatorUtil.isRegularCharacter(fields.introduction)
    ) {
      errMsg = ctx.__('validate_error_field', [ctx.__('label_introduction')]);
    }
    if (
      fields.introduction &&
      !validator.isLength(fields.introduction, 2, 100)
    ) {
      errMsg = ctx.__('validate_rangelength', [
        ctx.__('label_introduction'),
        2,
        100,
      ]);
    }
    if (fields.comments && !validatorUtil.isRegularCharacter(fields.comments)) {
      errMsg = ctx.__('validate_error_field', [ctx.__('label_comments')]);
    }
    if (fields.comments && !validator.isLength(fields.comments, 2, 100)) {
      errMsg = ctx.__('validate_rangelength', [
        ctx.__('label_comments'),
        2,
        100,
      ]);
    }
    if (errMsg) {
      throw new Error(errMsg);
    }
  },

  renderUserList(
    ctx,
    userInfo = {},
    userList = [],
    useClient = '2',
    params = {}
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        const newUserList = JSON.parse(JSON.stringify(userList));
        for (const userItem of newUserList) {
          const userContents = await ctx.service.content.find(
            {
              isPaging: '0',
            },
            {
              query: {
                uAuthor: userItem._id,
                state: '2',
              },
              files: '_id',
            }
          );
          userItem.content_num = userContents.length;
          userItem.watch_num = _.uniq(userItem.watchers).length;
          userItem.follow_num = _.uniq(userItem.followers).length;
          userItem.had_followed = false;

          // 参与的评论数
          const comments_num = await ctx.service.message.count({
            author: userItem._id,
          });
          userItem.comments_num = comments_num;

          // 收藏的文章数量
          userItem.favorites_num = userItem.favorites
            ? userItem.favorites.length
            : 0;

          // 只有查询单个用户才查询点赞总数和被关注人数
          if (params.apiName === 'getUserInfoById') {
            let total_likeNum = 0,
              total_despiseNum = 0;
            for (const contentItem of userContents) {
              total_likeNum += await ctx.service.user.count({
                praiseContents: contentItem._id,
              });
              total_despiseNum += await ctx.service.user.count({
                despises: contentItem._id,
              });
            }
            userItem.total_likeNum = total_likeNum;
            userItem.total_despiseNum = total_despiseNum;
          }

          if (!_.isEmpty(userInfo)) {
            if (userInfo.watchers.indexOf(userItem._id) >= 0) {
              userItem.had_followed = true;
            }
          }

          siteFunc.clearUserSensitiveInformation(userItem);
        }

        resolve(newUserList);
      } catch (error) {
        resolve(userList);
      }
    });
  },

  async updateUser(ctx, app) {
    try {
      const fields = ctx.request.body;

      this.checkUserFormData(ctx, fields);

      const userObj = {};

      if (fields.enable !== 'undefined' && fields.enable !== undefined) {
        userObj.enable = fields.enable;
      }

      if (
        fields.phoneNum &&
        validatorUtil.checkPhoneNum(fields.phoneNum.toString())
      ) {
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
          throw new Error(ctx.__('validate_error_params'));
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

      const targetUserId = ctx.session.user._id;

      await ctx.service.user.update(ctx, targetUserId, userObj);

      ctx.helper.renderSuccess(ctx, {
        data: {},
        message: ctx.__('sys_layer_option_success'),
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getMyFollowInfos(ctx, app) {
    try {
      const userInfo = ctx.session.user;

      const targetUser = await ctx.service.user.item(ctx, {
        query: {
          _id: userInfo._id,
        },
        files: 'watchers',
        populate: [
          {
            path: 'watchers',
            select: 'name userName _id logo',
          },
        ],
      });
      // console.log('-targetUser----', targetUser)
      const watchersList = targetUser.watchers;

      let watchCreatorContents = [];
      for (const creator of watchersList) {
        const creatorId = creator._id;

        const creatorContents = await ctx.service.content.find(
          {
            isPaging: '0',
          },
          {
            query: {
              uAuthor: creatorId,
              state: '2',
            },
            files: getContentListFields(true),
            populate: [
              {
                path: 'uAuthor',
                select: '_id userName logo name group',
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
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getUserInfoBySession(ctx, app) {
    try {
      const userId = ctx.session.user._id;
      const targetUser = await ctx.service.user.item(ctx, {
        query: {
          _id: userId,
        },
        files: getAuthUserFields('session'),
      });
      ctx.helper.renderSuccess(ctx, {
        data: targetUser,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getUserInfoById(ctx, app) {
    try {
      const targetId = ctx.query.id;
      const user = ctx.session.user || {};

      if (!shortid.isValid(targetId)) {
        throw new Error(ctx.__('validate_error_params'));
      }

      const targetUser = await ctx.service.user.item(ctx, targetId, {
        files: getAuthUserFields('base'),
      });
      const userArr = [].push(targetUser);
      const renderUser = await this.renderUserList(ctx, user, userArr, '2', {
        apiName: 'getUserInfoById',
      });
      let userInfo = {};
      if (!_.isEmpty(renderUser) && renderUser.length === 1) {
        userInfo = renderUser[0];
      }

      ctx.helper.renderSuccess(ctx, {
        data: userInfo,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async bindEmailOrPhoneNum(ctx, app) {
    try {
      const fields = ctx.request.body || {};

      const userInfo = ctx.session.user;
      const bindType = fields.type;
      let errMsg = '';

      if (bindType !== '1' && bindType !== '2') {
        throw new Error(ctx.__('validate_error_params'));
      }

      if (bindType === '1') {
        if (
          !fields.phoneNum ||
          !validatorUtil.checkPhoneNum(fields.phoneNum.toString())
        ) {
          errMsg = ctx.__('validate_inputCorrect', [
            ctx.__('label_user_phoneNum'),
          ]);
        }

        if (!fields.countryCode) {
          errMsg = ctx.__('validate_selectNull', [
            ctx.__('label_user_countryCode'),
          ]);
        }

        if (userInfo.phoneNum) {
          throw new Error(
            ctx.__('user_action_tips_repeat', [ctx.__('lc_bind')])
          );
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

        const userRecords = await ctx.service.user.item(ctx, {
          query: queryUserObj,
        });

        if (!_.isEmpty(userRecords)) {
          throw new Error(ctx.__('validate_user_had_bind'));
        }
      } else {
        if (!validatorUtil.checkEmail(fields.email)) {
          errMsg = ctx.__('validate_inputCorrect', [
            ctx.__('label_user_email'),
          ]);
        }

        if (userInfo.email) {
          throw new Error(
            ctx.__('user_action_tips_repeat', [ctx.__('lc_bind')])
          );
        }

        const userRecords = await ctx.service.user.item(ctx, {
          query: {
            email: fields.email,
          },
        });
        if (!_.isEmpty(userRecords)) {
          throw new Error(ctx.__('validate_user_had_bind'));
        }
      }

      const endStr =
        bindType === '2' ? fields.email : fields.countryCode + fields.phoneNum;

      const currentCode = await app.cache.get(
        app.config.session_secret + '_sendMessage_tourist_bindAccount_' + endStr
      );

      if (
        !fields.messageCode ||
        !validator.isNumeric(fields.messageCode.toString()) ||
        fields.messageCode.length !== 6 ||
        currentCode !== fields.messageCode
      ) {
        errMsg = ctx.__('validate_inputCorrect', [
          ctx.__('label_user_imageCode'),
        ]);
      }

      if (errMsg) {
        throw new Error(errMsg);
      }

      const userObj = {};

      if (bindType === '1') {
        userObj.phoneNum = fields.phoneNum;
        userObj.countryCode = fields.countryCode;
      } else {
        userObj.email = fields.email;
      }

      await ctx.service.user.update(ctx, userInfo._id, userObj);

      ctx.helper.clearRedisByType(endStr, '_sendMessage_tourist_bindAccount_');

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async loginAction(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      let errMsg = '',
        loginType = fields.loginType || '1'; // 1:手机验证码登录 2:手机号密码登录 3:邮箱密码登录

      // TODO 临时兼容没有改动的APP端
      if (fields.phoneNum && fields.password) {
        loginType = 2;
      }

      if (fields.email && fields.password) {
        loginType = 3;
      }

      if (
        loginType !== '1' &&
        loginType !== '2' &&
        loginType !== '3' &&
        loginType !== '4'
      ) {
        throw new Error(ctx.__('validate_error_params'));
      }

      if (loginType === '1' || loginType === '2') {
        if (
          !fields.phoneNum ||
          !validatorUtil.checkPhoneNum(fields.phoneNum.toString())
        ) {
          errMsg = ctx.__('validate_inputCorrect', [
            ctx.__('label_user_phoneNum'),
          ]);
        }

        if (!fields.countryCode) {
          errMsg = ctx.__('validate_selectNull', [
            ctx.__('label_user_countryCode'),
          ]);
        }

        if (loginType === '2') {
          if (!validatorUtil.checkPwd(fields.password, 6, 12)) {
            errMsg = ctx.__('validate_rangelength', [
              ctx.__('label_user_password'),
              6,
              12,
            ]);
          }
        } else if (loginType === '1') {
          const currentCode = await app.cache.get(
            app.config.session_secret +
              '_sendMessage_login_' +
              (fields.countryCode + fields.phoneNum)
          );
          if (
            !fields.messageCode ||
            !validator.isNumeric(fields.messageCode.toString()) ||
            fields.messageCode.length !== 6 ||
            currentCode !== fields.messageCode
          ) {
            errMsg = ctx.__('validate_inputCorrect', [
              ctx.__('label_user_imageCode'),
            ]);
          }
        }
      } else if (loginType === '3') {
        if (!validatorUtil.checkEmail(fields.email)) {
          errMsg = ctx.__('validate_inputCorrect', [
            ctx.__('label_user_email'),
          ]);
        }
        if (!validatorUtil.checkPwd(fields.password, 6, 12)) {
          errMsg = ctx.__('validate_rangelength', [
            ctx.__('label_user_password'),
            6,
            12,
          ]);
        }
      } else if (loginType === '4') {
        if (!validatorUtil.checkEmail(fields.email)) {
          errMsg = ctx.__('validate_inputCorrect', [
            ctx.__('label_user_email'),
          ]);
        }
        const currentCode = await app.cache.get(
          app.config.session_secret + '_sendMessage_login_' + fields.email
        );
        if (
          !fields.messageCode ||
          !validator.isNumeric(fields.messageCode.toString()) ||
          fields.messageCode.length !== 6 ||
          currentCode !== fields.messageCode
        ) {
          errMsg = ctx.__('validate_inputCorrect', [
            ctx.__('label_user_imageCode'),
          ]);
        }
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

      if (
        loginType !== '3' &&
        loginType !== '4' &&
        fields.phoneNum.indexOf('0') === 0
      ) {
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
        const user = await ctx.service.user.item(ctx, {
          query: userObj,
          files: getAuthUserFields('login'),
        });

        if (_.isEmpty(user)) {
          if (loginType === '2') {
            throw new Error(ctx.__('validate_login_notSuccess_1'));
          } else {
            throw new Error(ctx.__('validate_login_notSuccess'));
          }
        } else {
          if (
            fields.password !==
            ctx.helper.decrypt(user.password, app.config.encrypt_key)
          ) {
            throw new Error(ctx.__('validate_login_notSuccess'));
          }
        }
        if (!user.enable) {
          throw new Error(ctx.__('validate_user_forbiden'));
        }

        if (!user.loginActive) {
          await ctx.service.user.update(ctx, user._id, {
            loginActive: true,
          });
        }

        const renderUser = JSON.parse(JSON.stringify(user));

        // 针对 App 端同时创建 Token
        renderUser.token = jwt.sign(
          {
            userId: user._id,
          },
          app.config.encrypt_key,
          {
            expiresIn: '30day',
          }
        );

        // 将cookie存入缓存
        ctx.cookies.set(
          'api_' + app.config.auth_cookie_name,
          renderUser.token,
          {
            path: '/',
            maxAge: app.config.userMaxAge,
            signed: true,
            httpOnly: true,
          }
        ); // cookie 有效期30天

        // 重置验证码
        const endStr =
          loginType === '3'
            ? fields.email
            : fields.countryCode + fields.phoneNum;
        ctx.helper.clearRedisByType(endStr, '_sendMessage_login_');

        ctx.helper.sendMessageToClient(
          ctx,
          'reguser',
          `用户 ${renderUser.userName} 登录了`
        );

        // console.log('--111---',renderUser)
        ctx.helper.renderSuccess(ctx, {
          data: renderUser,
          message: ctx.__('validate_user_loginOk'),
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
        const newUser = await ctx.service.user.item(ctx, {
          query: {
            _id: currentUser._id,
          },
          files: getAuthUserFields('login'),
        });
        const renderUser = JSON.parse(JSON.stringify(newUser));

        renderUser.token = jwt.sign(
          {
            userId: renderUser._id,
          },
          app.config.encrypt_key,
          {
            expiresIn: '30day',
          }
        );
        ctx.cookies.set(
          'api_' + app.config.auth_cookie_name,
          renderUser.token,
          {
            path: '/',
            maxAge: app.config.userMaxAge,
            signed: true,
            httpOnly: true,
          }
        );

        // 重置验证码
        const endStr =
          loginType === '3'
            ? fields.email
            : fields.countryCode + fields.phoneNum;
        ctx.helper.clearRedisByType(endStr, '_sendMessage_login_');
        ctx.helper.renderSuccess(ctx, {
          data: renderUser,
          message: ctx.__('validate_user_loginOk'),
        });
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async touristLoginAction(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      const userCode = fields.userCode;

      if (!userCode) {
        throw new Error(ctx.__('validate_error_params'));
      }

      const renderCode = ctx.helper.encrypt(userCode, app.config.encrypt_key);

      if (!renderCode) {
        throw new Error(ctx.__('validate_error_params'));
      }

      const targetUser = await ctx.service.user.item(ctx, {
        query: {
          deviceId: renderCode,
        },
      });

      if (!_.isEmpty(targetUser)) {
        console.log('get old tourist User');

        if (!targetUser.enable) {
          throw new Error(ctx.__('validate_user_forbiden'));
        }

        const renderUser = JSON.parse(JSON.stringify(targetUser));

        // 针对 App 端同时创建 Token
        renderUser.token = jwt.sign(
          {
            userId: targetUser._id,
          },
          app.config.encrypt_key,
          {
            expiresIn: '30day',
          }
        );

        ctx.helper.renderSuccess(ctx, {
          data: renderUser,
          message: ctx.__('validate_user_loginOk'),
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

        const newUser = await ctx.service.user.item(ctx, {
          query: {
            _id: currentUser._id,
          },
          files: getAuthUserFields('login'),
        });
        const renderUser = JSON.parse(JSON.stringify(newUser));

        renderUser.token = jwt.sign(
          {
            userId: renderUser._id,
          },
          app.config.encrypt_key,
          {
            expiresIn: '30day',
          }
        );

        ctx.helper.renderSuccess(ctx, {
          data: renderUser,
          message: ctx.__('validate_user_loginOk'),
        });
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async regAction(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      let errMsg = '';
      const regType = fields.regType || '1'; // 1:手机号注册  2:邮箱注册

      if (regType !== '1' && regType !== '2') {
        throw new Error(ctx.__('validate_error_params'));
      }

      if (regType === '1') {
        if (
          !fields.phoneNum ||
          !validatorUtil.checkPhoneNum(fields.phoneNum.toString())
        ) {
          errMsg = ctx.__('validate_inputCorrect', [
            ctx.__('label_user_phoneNum'),
          ]);
        }

        if (!fields.countryCode) {
          errMsg = ctx.__('validate_selectNull', [
            ctx.__('label_user_countryCode'),
          ]);
        }
      } else if (regType === '2') {
        if (!validatorUtil.checkEmail(fields.email)) {
          errMsg = ctx.__('validate_inputCorrect', [
            ctx.__('label_user_email'),
          ]);
        }
      }

      const endStr =
        regType === '1' ? fields.countryCode + fields.phoneNum : fields.email;
      const currentCode = await app.cache.get(
        app.config.session_secret + '_sendMessage_reg_' + endStr
      );

      if (
        !validator.isNumeric(fields.messageCode.toString()) ||
        fields.messageCode.length !== 6 ||
        currentCode !== fields.messageCode
      ) {
        errMsg = ctx.__('validate_inputCorrect', [
          ctx.__('label_user_imageCode'),
        ]);
      }

      if (fields.userName && !validator.isLength(fields.userName, 2, 12)) {
        errMsg = ctx.__('validate_rangelength', [
          ctx.__('label_user_userName'),
          2,
          12,
        ]);
      }

      if (
        fields.userName &&
        !validatorUtil.isRegularCharacter(fields.userName)
      ) {
        errMsg = ctx.__('validate_error_field', [
          ctx.__('label_user_userName'),
        ]);
      }

      if (!validatorUtil.checkPwd(fields.password, 6, 12)) {
        errMsg = ctx.__('validate_rangelength', [
          ctx.__('label_user_password'),
          6,
          12,
        ]);
      }

      if (errMsg) {
        throw new Error(errMsg);
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

      const user = await ctx.service.user.item(ctx, {
        query: queryUserObj,
      });

      if (!_.isEmpty(user)) {
        throw new Error(ctx.__('validate_hadUse_userNameOrEmail'));
      } else {
        const endUser = await ctx.service.user.create(userObj);

        ctx.session.user = await ctx.service.user.item(ctx, {
          query: {
            _id: endUser._id,
          },
          files: getAuthUserFields('session'),
        });

        // 重置验证码
        ctx.helper.clearRedisByType(endStr, '_sendMessage_reg_');

        ctx.helper.renderSuccess(ctx, {
          message: ctx.__('validate_user_regOk'),
        });
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async checkPhoneNumExist(ctx, app) {
    try {
      const phoneNum = ctx.query.phoneNum || '';
      const countryCode = ctx.query.countryCode || '';
      let errMsg = '';

      if (!phoneNum || !validatorUtil.checkPhoneNum(phoneNum.toString())) {
        errMsg = ctx.__('validate_inputCorrect', [
          ctx.__('label_user_phoneNum'),
        ]);
      }

      if (!validator.isNumeric(countryCode.toString())) {
        errMsg = ctx.__('validate_inputCorrect', [
          ctx.__('label_user_countryCode'),
        ]);
      }

      if (errMsg) {
        throw new Error(errMsg);
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

      const targetUser = await ctx.service.user.item(ctx, {
        query: queryUserObj,
      });
      let checkState = false;
      if (!_.isEmpty(targetUser)) {
        checkState = true;
      }

      ctx.helper.renderSuccess(ctx, {
        data: {
          checkState,
        },
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async checkHadSetLoginPassword(ctx, app) {
    try {
      const userInfo = ctx.session.user;
      const targetUser = await ctx.service.user.item(ctx, {
        query: {
          _id: userInfo._id,
        },
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
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async logOut(ctx, app) {
    ctx.session = null;
    ctx.cookies.set('api_' + app.config.auth_cookie_name, null);
    ctx.helper.renderSuccess(ctx, {
      message: ctx.__('validate_user_logoutOk'),
    });
  },

  async sentConfirmEmail(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      const targetEmail = fields.email;
      // 获取当前发送邮件的时间
      const retrieveTime = new Date().getTime();
      if (!validator.isEmail(targetEmail)) {
        throw new Error(ctx.__('validate_error_params'));
      } else {
        const user = await ctx.service.user.item(ctx, {
          query: {
            email: targetEmail,
          },
          files: 'userName email password _id',
        });
        if (!_.isEmpty(user) && user._id) {
          await ctx.service.user.update(ctx, user._id, {
            retrieve_time: retrieveTime,
          });
          // 发送通知邮件给用户
          await ctx.helper.reqJsonData(
            'mailTemplate/sendEmail',
            {
              tempkey: '0',
              info: {
                email: targetEmail,
                userName: user.userName,
                password: user.password,
              },
            },
            'post'
          );

          ctx.helper.renderSuccess(ctx, {
            message: ctx.__('label_resetpwd_sendEmail_success'),
          });
        } else {
          ctx.helper.renderFail(ctx, {
            message: ctx.__('label_resetpwd_noemail'),
          });
        }
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async reSetPass(ctx, app) {
    const params = ctx.query;
    const tokenId = params.key;
    const keyArr = ctx.helper.getKeyArrByTokenId(tokenId);

    if (keyArr && validator.isEmail(keyArr[1])) {
      try {
        const defaultTemp = await ctx.service.contentTemplate.item(ctx, {
          query: {
            using: true,
          },
          populate: ['items'],
        });
        const noticeTempPath = '/users/userNotice.html';
        const reSetPwdTempPath = '/users/userResetPsd.html';

        const user = await ctx.service.user.item(ctx, {
          query: {
            email: keyArr[1],
          },
          files: 'email password _id retrieve_time',
        });
        // console.log('---user---', user)
        // console.log('---keyArr---', keyArr)
        if (!_.isEmpty(user) && user._id) {
          ctx.params = {
            title: '找回密码',
            des: '找回密码',
          };
          const siteInfo = await ctx.getSiteInfo();
          const staticThemePath =
            app.config.static.prefix + '/themes/' + defaultTemp.alias;
          if (
            user.password === keyArr[0] &&
            keyArr[2] === app.config.session_secret
          ) {
            //  校验链接是否过期
            const now = new Date().getTime();
            const oneDay = 1000 * 60 * 60 * 24;
            if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
              const renderData = {
                infoType: 'warning',
                infoContent: ctx.__('label_resetpwd_link_timeout'),
                themePublicPath: `../${defaultTemp.alias}/default.html`,
                staticforder: defaultTemp.alias,
                staticRootPath: app.config.static.prefix,
                staticThemePath,
                site: siteInfo,
                ogData: {},
              };
              await ctx.render(noticeTempPath, renderData);
            } else {
              const renderData = {
                tokenId,
                themePublicPath: `../${defaultTemp.alias}/default.html`,
                staticforder: defaultTemp.alias,
                staticRootPath: app.config.static.prefix,
                staticThemePath,
                site: siteInfo,
                ogData: {},
              };
              await ctx.render(reSetPwdTempPath, renderData);
            }
          } else {
            await ctx.render(noticeTempPath, {
              infoType: 'warning',
              infoContent: ctx.__('label_resetpwd_error_message'),
              themePublicPath: `../${defaultTemp.alias}/default.html`,
              staticforder: defaultTemp.alias,
              staticRootPath: app.config.static.prefix,
              staticThemePath,
              site: siteInfo,
              ogData: {},
            });
          }
        } else {
          ctx.helper.renderFail(ctx, {
            message: ctx.__('label_resetpwd_noemail'),
          });
        }
      } catch (err) {
        ctx.helper.renderFail(ctx, {
          message: err,
        });
      }
    } else {
      ctx.helper.renderFail(ctx, {
        message: ctx.__('label_resetpwd_noemail'),
      });
    }
  },

  async resetMyPassword(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      const phoneNum = fields.phoneNum;
      const countryCode = fields.countryCode;
      const messageCode = fields.messageCode;

      const type = fields.type || '1';
      let errMsg = '';

      if (type !== '1' && type !== '2') {
        throw new Error(ctx.__('validate_error_params'));
      }

      if (type === '1') {
        if (!phoneNum || !validator.isNumeric(phoneNum.toString())) {
          throw new Error(
            ctx.__('validate_inputCorrect', [ctx.__('label_user_phoneNum')])
          );
        }

        if (!countryCode) {
          errMsg = ctx.__('validate_selectNull', [
            ctx.__('label_user_countryCode'),
          ]);
        }
      } else if (type === '2') {
        if (!validatorUtil.checkEmail(fields.email)) {
          throw new Error(
            ctx.__('validate_inputCorrect', [ctx.__('label_user_email')])
          );
        }
      }

      const endStr =
        type === '1' ? fields.countryCode + fields.phoneNum : fields.email;
      const currentCode = await app.cache.get(
        app.config.session_secret + '_sendMessage_resetPassword_' + endStr
      );

      if (
        !validator.isNumeric(messageCode.toString()) ||
        messageCode.length !== 6 ||
        currentCode !== fields.messageCode
      ) {
        errMsg = ctx.__('validate_inputCorrect', [
          ctx.__('label_user_imageCode'),
        ]);
      }

      if (!fields.password) {
        errMsg = ctx.__('validate_inputCorrect', [
          ctx.__('label_user_password'),
        ]);
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

      const targetUser = await ctx.service.user.item(ctx, {
        query: queryUserObj,
      });

      if (!_.isEmpty(targetUser)) {
        await ctx.service.user.update(ctx, targetUser._id, {
          password: fields.password,
        });

        // 重置验证码
        ctx.helper.clearRedisByType(endStr, '_sendMessage_resetPassword_');

        ctx.helper.renderSuccess(ctx, {
          message: ctx.__('restful_api_response_success', [
            ctx.__('lc_basic_set_password'),
          ]),
        });
      } else {
        throw new Error(ctx.__('label_resetpwd_error_message'));
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  // web 端找回密码
  async updateNewPsd(ctx, app) {
    const fields = ctx.request.body || {};
    let errMsg = '';
    if (!fields.tokenId) {
      errMsg = 'token is null';
    }

    if (!fields.password) {
      errMsg = 'password is null';
    }

    if (fields.password !== fields.confirmPassword) {
      errMsg = ctx.__('validate_error_pass_atypism');
    }

    if (errMsg) {
      throw new Error(errMsg);
    } else {
      const keyArr = ctx.helper.getKeyArrByTokenId(fields.tokenId);
      if (keyArr && validator.isEmail(keyArr[1])) {
        try {
          const user = await ctx.service.user.item(ctx, {
            query: {
              email: keyArr[1],
            },
            files: 'userName email password _id',
          });
          if (!_.isEmpty(user) && user._id) {
            if (
              user.password === keyArr[0] &&
              keyArr[2] === app.config.session_secret
            ) {
              await ctx.service.user.update(ctx, user._id, {
                password: fields.password,
                retrieve_time: '',
              });
              ctx.helper.renderSuccess(ctx, {
                message: ctx.__('restful_api_response_success', [
                  ctx.__('lc_basic_set_password'),
                ]),
              });
            } else {
              throw new Error(ctx.__('validate_error_params'));
            }
          } else {
            throw new Error(ctx.__('validate_error_params'));
          }
        } catch (error) {
          ctx.helper.renderFail(ctx, {
            message: ctx.__('validate_error_params'),
          });
        }
      } else {
        ctx.helper.renderFail(ctx, {
          message: ctx.__('validate_error_params'),
        });
      }
    }
  },

  async modifyMyPsd(ctx, app) {
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
        throw new Error(ctx.__('validate_error_params'));
      }

      const targetUser = await ctx.service.user.item(ctx, {
        query: {
          _id: userInfo._id,
        },
        files: '_id password',
      });

      if (!_.isEmpty(targetUser)) {
        if (
          fields.oldPassword !==
          ctx.helper.decrypt(targetUser.password, app.config.encrypt_key)
        ) {
          throw new Error(ctx.__('label_resetpwd_error_message'));
        }

        await ctx.service.user.update(ctx, userInfo._id, {
          password: fields.password,
        });

        ctx.helper.renderSuccess(ctx, {
          message: ctx.__('restful_api_response_success', [
            ctx.__('lc_basic_set_password'),
          ]),
        });
      } else {
        throw new Error(ctx.__('label_resetpwd_error_message'));
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async addTags(ctx, app) {
    try {
      const userInfo = await ctx.service.user.item(ctx, {
        query: {
          _id: ctx.session.user._id,
        },
        files: 'watchTags',
      });
      const tagId = ctx.query.tagId;
      const followState = ctx.query.type;
      if (!shortid.isValid(tagId)) {
        throw new Error(ctx.__('validate_error_params'));
      }

      const targetTag = await ctx.service.contentTag.item(ctx, {
        query: {
          _id: tagId,
        },
      });
      if (_.isEmpty(targetTag)) {
        throw new Error(ctx.__('validate_error_params'));
      }
      const oldWatchTag = userInfo.watchTags || [];
      const oldWatchTagArr = _.concat([], oldWatchTag);
      if (oldWatchTagArr.indexOf(tagId) >= 0 && followState === '1') {
        throw new Error(ctx.__('validate_error_repost'));
      } else {
        if (followState === '1') {
          // oldWatchTagArr.push(tagId);
          await ctx.service.user.addToSet(ctx, userInfo._id, {
            watchTags: tagId,
          });
        } else if (followState === '0') {
          // oldWatchTagArr = _.filter(oldWatchTagArr, (item) => {
          //     return item !== tagId;
          // })
          await ctx.service.user.pull(ctx, userInfo._id, {
            watchTags: tagId,
          });
        } else {
          throw new Error(ctx.__('validate_error_params'));
        }
        // oldWatchTagArr = _.uniq(oldWatchTagArr);

        // await ctx.service.user.update(ctx, userInfo._id, {
        //     watchTags: oldWatchTagArr
        // });

        ctx.helper.renderSuccess(ctx);
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async followCreator(ctx, app) {
    try {
      const userInfo = ctx.session.user;
      const userId = userInfo._id;
      const creatorIds = ctx.query.creatorId;
      const creatorFollowState = ctx.query.followState || 'in';

      if (!creatorIds) {
        throw new Error(ctx.__('validate_error_params'));
      }

      const creatorIdArr = creatorIds.split(',');
      const targetWatcher = await ctx.service.user.item(ctx, {
        query: {
          _id: userId,
        },
      });
      for (const creatorId of creatorIdArr) {
        if (!shortid.isValid(creatorId)) {
          throw new Error(ctx.__('validate_error_params'));
        }

        if (creatorId === userId) {
          throw new Error(ctx.__('user_action_tips_subscribe_self'));
        }
        // console.log('---creatorId---', creatorId);
        const targetCreatorFollow = await ctx.service.user.item(ctx, {
          query: {
            _id: creatorId,
          },
        });
        // console.log('---targetCreatorFollow---', targetCreatorFollow);
        if (_.isEmpty(targetCreatorFollow)) {
          throw new Error(ctx.__('validate_error_params'));
        }

        const userWatcherArr = _.concat([], targetWatcher.watchers);
        const creatorFollowersArr = _.concat([], targetCreatorFollow.followers);

        if (
          userWatcherArr.indexOf(userId) >= 0 &&
          creatorFollowState === 'in'
        ) {
          throw new Error(ctx.__('validate_error_repost'));
        } else {
          if (creatorFollowState === 'in') {
            // 记录本人主动关注
            await ctx.service.user.addToSet(ctx, userId, {
              watchers: targetCreatorFollow._id,
            });
            // 记录会员被关注
            await ctx.service.user.addToSet(ctx, targetCreatorFollow._id, {
              followers: userId,
            });
          } else if (creatorFollowState === 'out') {
            // 记录本人主动取消关注
            await ctx.service.user.pull(ctx, userId, {
              watchers: targetCreatorFollow._id,
            });
            // 记录会员被取消关注
            await ctx.service.user.pull(ctx, targetCreatorFollow._id, {
              followers: userId,
            });
          } else {
            throw new Error(ctx.__('validate_error_params'));
          }

          // 发送关注消息
          if (creatorFollowState === 'in') {
            siteFunc.addSiteMessage('2', userInfo, targetCreatorFollow._id);
          }
        }

        ctx.helper.renderSuccess(ctx, {
          data: ctx.__('restful_api_response_success', [
            ctx.__(
              creatorFollowState === 'in'
                ? 'user_action_tips_add_creator'
                : 'user_action_tips_unsubscribe_creator'
            ),
          ]),
        });
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async sendVerificationCode(ctx, app) {
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
          throw new Error(ctx.__('label_systemnotice_nopower'));
        }

        const targetAdminUser = await ctx.service.adminUser.item(ctx, {
          query: {
            userName,
            password,
          },
        });

        if (!_.isEmpty(targetAdminUser)) {
          phoneNum = targetAdminUser.phoneNum;
          countryCode = targetAdminUser.countryCode;
        } else {
          throw new Error(ctx.__('label_systemnotice_nopower'));
        }
      } else {
        if (sendType === '1') {
          if (!phoneNum || !validator.isNumeric(phoneNum.toString())) {
            errMsg = ctx.__('validate_inputCorrect', [
              ctx.__('label_user_phoneNum'),
            ]);
          }

          if (!fields.countryCode) {
            errMsg = ctx.__('validate_selectNull', [
              ctx.__('label_user_countryCode'),
            ]);
          }
        } else if (sendType === '2') {
          if (!validatorUtil.checkEmail(fields.email)) {
            errMsg = ctx.__('validate_inputCorrect', [
              ctx.__('label_user_email'),
            ]);
          }
        }
      }

      if (!messageType) {
        errMsg = ctx.__('validate_error_params');
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
        throw new Error(ctx.__('validate_error_params'));
      }

      const endStr = sendType === '1' ? countryCode + phoneNum : email;
      const currentKey = app.config.session_secret + cacheKey + endStr;
      // console.log(currentStr, '--currentKey--', currentKey)
      ctx.helper.setMemoryCache(currentKey, currentStr, 1000 * 60 * 10); // 验证码缓存10分钟

      // 验证码加密
      const renderCode = ctx.helper.encrypt(currentStr, app.config.encrypt_key);
      console.log('renderCode: ', renderCode);

      if (sendType === '1') {
        // 发送短消息
        process.env.NODE_ENV === 'production' &&
          siteFunc.sendTellMessagesByPhoneNum(
            countryCode,
            phoneNum,
            currentStr.toString()
          );
      } else if (sendType === '2') {
        // 发送通知邮件给用户
        await ctx.helper.reqJsonData(
          'mailTemplate/sendEmail',
          {
            tempkey: '8',
            info: {
              email,
              msgCode: currentStr,
            },
          },
          'post'
        );
      } else {
        throw new Error(ctx.__('validate_error_params'));
      }

      ctx.helper.renderSuccess(ctx, {
        message: ctx.__('restful_api_response_success', [
          ctx.__('user_action_tips_sendMessage'),
        ]),
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

  async askContentThumbsUp(ctx, app) {
    try {
      let userInfo = ctx.session.user;
      const userId = userInfo._id;
      const contentId = ctx.query.contentId;
      const praiseState = ctx.query.praiseState || 'in';
      if (!shortid.isValid(contentId)) {
        throw new Error(ctx.__('validate_error_params'));
      }

      if (!_.isEmpty(userInfo)) {
        userInfo = await ctx.service.user.item(ctx, {
          query: {
            _id: userInfo._id,
          },
          files: getAuthUserFields('session'),
        });
      }

      const targetContent = await ctx.service.content.item(ctx, {
        query: {
          _id: contentId,
          state: '2',
        },
      });
      const targetMessage = await ctx.service.message.item(ctx, {
        query: {
          _id: contentId,
        },
      });

      let targetMediaType = '0';

      if (!_.isEmpty(targetContent)) {
        targetMediaType = '0'; // 帖子
        if (targetContent.uAuthor === userId) {
          throw new Error(ctx.__('user_action_tips_praise_self'));
        }
      } else if (!_.isEmpty(targetMessage)) {
        targetMediaType = '1'; // 评论
        if (targetMessage.author === userId) {
          throw new Error(ctx.__('user_action_tips_praise_self'));
        }
      } else {
        throw new Error(ctx.__('validate_error_params'));
      }

      let oldPraise = userInfo.praiseContents || [];
      if (targetMediaType === '1') {
        oldPraise = userInfo.praiseMessages || [];
      }

      let oldPraiseArr = _.concat([], oldPraise);
      if (oldPraiseArr.indexOf(contentId) >= 0 && praiseState === 'in') {
        throw new Error(
          ctx.__('user_action_tips_repeat', [
            ctx.__('user_action_type_give_thumbs_up'),
          ])
        );
      } else {
        if (praiseState === 'in') {
          oldPraiseArr.push(contentId);
        } else if (praiseState === 'out') {
          oldPraiseArr = _.filter(oldPraise, (item) => {
            return item !== contentId;
          });
        } else {
          throw new Error(ctx.__('validate_error_params'));
        }
        oldPraiseArr = _.uniq(oldPraiseArr);

        if (targetMediaType === '0') {
          await ctx.service.user.update(ctx, userInfo._id, {
            praiseContents: oldPraiseArr,
          });
        } else if (targetMediaType === '1') {
          await ctx.service.user.update(ctx, userInfo._id, {
            praiseMessages: oldPraiseArr,
          });
        }

        if (praiseState === 'in') {
          // 发送提醒消息
          if (targetMediaType === '0') {
            siteFunc.addSiteMessage(
              '4',
              userInfo,
              targetContent.uAuthor,
              contentId,
              {
                targetMediaType,
              }
            );
          } else if (targetMediaType === '1') {
            siteFunc.addSiteMessage(
              '4',
              userInfo,
              targetMessage.author,
              contentId,
              {
                targetMediaType,
              }
            );
          }
        }

        ctx.helper.renderSuccess(ctx, {
          message: ctx.__('restful_api_response_success', [
            ctx.__('user_action_type_give_thumbs_up'),
          ]),
        });
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async favoriteContent(ctx, app) {
    try {
      const userInfo = await ctx.service.user.item(ctx, {
        query: {
          _id: ctx.session.user._id,
        },
        files: getAuthUserFields('session'),
      });
      const contentId = ctx.query.contentId;
      const favoriteState = ctx.query.favoriteState || 'in';
      if (!shortid.isValid(contentId)) {
        throw new Error(ctx.__('validate_error_params'));
      }

      const targetContent = await ctx.service.content.item(ctx, {
        query: {
          _id: contentId,
          state: '2',
        },
      });

      let targetContentType = '0';
      if (!_.isEmpty(targetContent)) {
        targetContentType = '0'; // 普通帖子
      } else {
        throw new Error(ctx.__('validate_error_params'));
      }

      const oldFavorite = userInfo.favorites || [];

      let oldFavoriteArr = _.concat([], oldFavorite);
      if (oldFavoriteArr.indexOf(contentId) >= 0 && favoriteState === 'in') {
        throw new Error(
          ctx.__('user_action_tips_repeat', [
            ctx.__('user_action_type_give_favorite'),
          ])
        );
      } else {
        if (favoriteState === 'in') {
          oldFavoriteArr.push(contentId);
        } else if (favoriteState === 'out') {
          oldFavoriteArr = _.filter(oldFavorite, (item) => {
            return item !== contentId;
          });
        } else {
          throw new Error(ctx.__('validate_error_params'));
        }
        oldFavoriteArr = _.uniq(oldFavoriteArr);
        if (targetContentType === '0') {
          await ctx.service.user.update(ctx, userInfo._id, {
            favorites: oldFavoriteArr,
          });
        }

        ctx.helper.renderSuccess(ctx, {
          message: ctx.__('restful_api_response_success', [
            ctx.__('user_action_type_give_favorite'),
          ]),
        });
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async despiseContent(ctx, app) {
    try {
      const userInfo = ctx.session.user;
      const contentId = ctx.query.contentId;
      const despiseState = ctx.query.despiseState || 'in';
      if (!shortid.isValid(contentId)) {
        throw new Error(ctx.__('validate_error_params'));
      }

      const targetContent = await ctx.service.content.item(ctx, {
        query: {
          _id: contentId,
          state: '2',
        },
      });

      const targetMessage = await ctx.service.message.item(ctx, {
        query: {
          _id: contentId,
        },
      });
      let targetMediaType = '0';

      if (!_.isEmpty(targetContent)) {
        targetMediaType = '0'; // 帖子
      } else if (!_.isEmpty(targetMessage)) {
        targetMediaType = '1'; // 评论
      } else {
        throw new Error(ctx.__('validate_error_params'));
      }

      let oldDespise = userInfo.despises || [];
      if (targetMediaType === '1') {
        oldDespise = userInfo.despiseMessage || [];
      }

      let oldDespiseArr = _.concat([], oldDespise);

      if (oldDespiseArr.indexOf(contentId) >= 0 && despiseState === 'in') {
        throw new Error(
          ctx.__('user_action_tips_repeat', [
            ctx.__('user_action_type_give_despise'),
          ])
        );
      } else {
        if (despiseState === 'in') {
          oldDespiseArr.push(contentId);
        } else if (despiseState === 'out') {
          oldDespiseArr = _.filter(oldDespise, (item) => {
            return item !== contentId;
          });
        } else {
          throw new Error(ctx.__('validate_error_params'));
        }
        oldDespiseArr = _.uniq(oldDespiseArr);

        if (targetMediaType === '0') {
          await ctx.service.user.update(ctx, userInfo._id, {
            despises: oldDespiseArr,
          });
        } else if (targetMediaType === '1') {
          await ctx.service.user.update(ctx, userInfo._id, {
            despiseMessage: oldDespiseArr,
          });
        }

        ctx.helper.renderSuccess(ctx, {
          message: ctx.__('restful_api_response_success', [
            ctx.__('user_action_type_give_despise'),
          ]),
        });
      }
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = RegUserController;
