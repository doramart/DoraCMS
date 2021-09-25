/*
 * @Author: doramart
 * @Date: 2019-09-25 14:16:44
 * @Last Modified by: doramart
 * @Last Modified time: 2019-09-26 14:55:22
 */
'use strict';
const siteFunc = {
  clearUserSensitiveInformation(targetObj) {
    targetObj.password && delete targetObj.password;
    targetObj.countryCode && delete targetObj.countryCode;
    targetObj.phoneNum && delete targetObj.phoneNum;
    targetObj.email && delete targetObj.email;
    targetObj.watchSpecials && delete targetObj.watchSpecials;
    targetObj.watchCommunity && delete targetObj.watchCommunity;
    targetObj.praiseCommunityContent && delete targetObj.praiseCommunityContent;
    targetObj.praiseMessages && delete targetObj.praiseMessages;
    targetObj.praiseContents && delete targetObj.praiseContents;
    targetObj.favoriteCommunityContent &&
      delete targetObj.favoriteCommunityContent;
    targetObj.favorites && delete targetObj.favorites;
    targetObj.despiseCommunityContent &&
      delete targetObj.despiseCommunityContent;
    targetObj.despiseMessage && delete targetObj.despiseMessage;
    targetObj.despises && delete targetObj.despises;
    targetObj.watchers && delete targetObj.watchers;
    targetObj.followers && delete targetObj.followers;
  },

  async addSiteMessage(
    type = '',
    activeUser = '',
    passiveUser = '',
    content = '',
    params = {
      targetMediaType: '0',
      recordId: '',
    }
  ) {
    try {
      const messageObj = {
        type,
        activeUser: activeUser._id,
        passiveUser,
        recordId: params.recordId,
        isRead: false,
      };

      if (params.targetMediaType === '0') {
        messageObj.content = content;
      } else if (params.targetMediaType === '1') {
        messageObj.message = content;
      } else if (params.targetMediaType === '2') {
        messageObj.communityContent = content;
      } else if (params.targetMediaType === '3') {
        messageObj.communityMessage = content;
      }

      // const {
      //     siteMessageService
      // } = require('@service');
      // await siteMessageService.create(messageObj);
    } catch (error) {
      // logUtil.error(error, {});
    }
  },

  randomString(len, charSet) {
    charSet =
      charSet ||
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < len; i++) {
      const randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
  },

  sendTellMessagesByPhoneNum() {
    console.log('待实现');
  },
};
module.exports = siteFunc;
