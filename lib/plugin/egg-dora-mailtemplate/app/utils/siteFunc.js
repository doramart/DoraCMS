/*
 * @Author: doramart
 * @Date: 2019-09-25 14:16:44
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 23:22:01
 */
'use strict';
const siteFunc = {
  // 定义模板类型
  emailTypeKey() {
    return {
      0: '找回密码',
      // 1: '注册激活',
      // 2: '管理员留言提醒',
      // 3: '联系管理员',
      // 4: '联系用户',
      // 5: 'Bug提醒',
      6: '留言提醒',
      // 7: '注册成功',
      8: '邮箱验证码', // 发送邮箱验证码
    };
  },
  renderHtmlByKey(html, dataSource, keysStr) {
    let renderHtml = html;
    const keyArr = keysStr.split(',');
    for (const aliasKey of keyArr) {
      const targetKey = 'tempkey_' + aliasKey;
      renderHtml = renderHtml.replace(
        new RegExp(targetKey, 'gi'),
        dataSource[aliasKey]
      );
    }
    return renderHtml;
  },
};
module.exports = siteFunc;
