/*
 * @Author: doramart 
 * @Date: 2019-09-25 14:16:44 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-02-10 11:55:19
 */


var siteFunc = {

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
 
        }
    },
    renderHtmlByKey(html, dataSource, keysStr) {
        let renderHtml = html;
        let keyArr = keysStr.split(',');
        for (const aliasKey of keyArr) {
            let targetKey = 'tempkey_' + aliasKey;
            renderHtml = renderHtml.replace(new RegExp(targetKey, 'gi'), dataSource[aliasKey]);
        }
        return renderHtml;
    },


};
module.exports = siteFunc;