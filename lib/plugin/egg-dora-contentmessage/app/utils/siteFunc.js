/*
 * @Author: doramart
 * @Date: 2019-09-25 14:16:44
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 23:07:36
 */
'use strict';
const siteFunc = {
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
};
module.exports = siteFunc;
