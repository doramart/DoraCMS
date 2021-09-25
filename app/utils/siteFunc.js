/**
 * Created by Administrator on 2015/5/30.
 */

'use strict';
const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');

const siteFunc = {
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

  getNoticeConfig(type, value) {
    let noticeObj;
    if (type === 'reg') {
      noticeObj = {
        type: '2',
        systemSender: 'doraCMS',
        title: '用户注册提醒',
        content: '新增注册用户 ' + value,
        action: type,
      };
    } else if (type === 'msg') {
      noticeObj = {
        type: '2',
        sender: value.author,
        title: '用户留言提醒',
        content: '用户 ' + value.author.userName + ' 给您留言啦！',
        action: type,
      };
    }
    return noticeObj;
  },

  async renderNoPowerMenus(manageCates, adminPower, buildTree = true) {
    const newResources = [],
      newRootCates = [];
    const rootCates = _.filter(manageCates, (doc) => {
      return doc.parentId === '0';
    });
    const menuCates = _.filter(manageCates, (doc) => {
      return doc.type === '0' && doc.parentId !== '0';
    });
    const optionCates = _.filter(manageCates, (doc) => {
      return doc.type !== '0';
    });
    if (!_.isEmpty(adminPower)) {
      // 是否显示子菜单
      for (let i = 0; i < menuCates.length; i++) {
        const resourceObj = JSON.parse(JSON.stringify(menuCates[i]));
        const cateFlag = this.checkNoAllPower(
          resourceObj._id,
          optionCates,
          adminPower
        );
        if (!cateFlag) {
          newResources.push(resourceObj);
        }
      }
      // 是否显示大类菜单
      for (const cate of rootCates) {
        const fiterSubCates = _.filter(newResources, (doc) => {
          return doc.parentId === cate._id;
        });
        if (fiterSubCates.length !== 0) {
          newRootCates.push(cate);
        }
      }
    }

    const allResources = newResources.concat(newRootCates);
    const renderResources = buildTree
      ? this.buildTree(allResources)
      : allResources;
    return renderResources;
  },

  /**
   * 将一维的扁平数组转换为多层级对象
   * @param  {[type]} list 一维数组，数组中每一个元素需包含id和parentId两个属性
   * @return {[type]} tree 多层级树状结构
   */
  buildTree(list) {
    const currentArr = [];
    const temp = {};
    const tree = {};
    for (const i in list) {
      temp[list[i]._id] = list[i];
    }
    for (const i in temp) {
      if (temp[i].parentId && temp[i].parentId !== '0') {
        if (!temp[temp[i].parentId].children) {
          temp[temp[i].parentId].children = [];
        }
        const currentTemp = this.renderTemp(temp[i]);
        temp[temp[i].parentId].children.push(currentTemp);
      } else {
        tree[temp[i]._id] = this.renderTemp(temp[i], true);
      }
    }
    for (const item in tree) {
      currentArr.push(tree[item]);
    }
    return currentArr;
  },

  renderTemp(temp, parent = false) {
    const renderTemp = {};
    if (parent) {
      renderTemp.alwaysShow = true;
    }
    renderTemp.path = '/admin/' + temp.routePath;
    renderTemp.hidden = !temp.enable;
    renderTemp.icon = temp.icon;
    renderTemp.name = temp.comments;
    renderTemp.children = temp.children;
    renderTemp.api = temp.api;
    renderTemp.redirect = temp.parentId === '0' ? 'noRedirect' : '';
    renderTemp.meta = {
      title: temp.comments,
    };
    if (renderTemp.icon) {
      renderTemp.meta.icon = temp.icon;
    }

    return renderTemp;
  },

  // 子菜单都无权限校验
  checkNoAllPower(resourceId, childCates, power) {
    let cateFlag = true;
    const rootCates = _.filter(childCates, (doc) => {
      return doc.parentId === resourceId;
    });
    for (const cate of rootCates) {
      if (power.indexOf(cate._id) > -1) {
        cateFlag = false;
        break;
      }
    }
    return cateFlag;
  },

  getStrLength(str) {
    let charCode = -1;
    const len = str.length;
    let realLength = 0;
    let zhChar = 0,
      enChar = 0;
    for (let i = 0; i < len; i++) {
      charCode = str.charCodeAt(i);
      if (charCode >= 0 && charCode <= 128) {
        realLength += 1;
        enChar++;
      } else {
        realLength += 2;
        zhChar++;
      }
    }
    return {
      length: realLength,
      enChar,
      zhChar,
    };
  },

  setTempParentId(arr, key) {
    for (let i = 0; i < arr.length; i++) {
      const pathObj = arr[i];
      pathObj.parentId = key;
    }
    return arr;
  },

  getTempBaseFile(path, viewPath = '', themePath = '') {
    const thisType = path.split('.')[1];
    let basePath;
    if (thisType === 'html') {
      basePath = viewPath;
    } else if (thisType === 'json') {
      basePath = process.cwd();
    } else {
      basePath = themePath;
    }
    return basePath;
  },

  // 扫描某路径下文件夹是否存在
  checkExistFile(tempFilelist, forderArr) {
    let filterForderArr = [],
      distPath = false;
    for (let i = 0; i < forderArr.length; i++) {
      const forder = forderArr[i];
      const currentForder = _.filter(tempFilelist, (fileObj) => {
        return fileObj.name === forder;
      });
      filterForderArr = filterForderArr.concat(currentForder);
    }
    if (
      filterForderArr.length > 0 &&
      tempFilelist.length >= forderArr.length &&
      filterForderArr.length >= forderArr.length
    ) {
      distPath = true;
    }

    return distPath;
  },

  // 筛选内容中的url
  getAHref(htmlStr, type = 'image') {
    let reg = /<img.+?src=('|")?([^'"]+)('|")?(?:\s+|>)/gim;
    if (type === 'video') {
      reg = /<video.+?src=('|")?([^'"]+)('|")?(?:\s+|>)/gim;
    } else if (type === 'audio') {
      reg = /<audio.+?src=('|")?([^'"]+)('|")?(?:\s+|>)/gim;
    }
    const arr = [];
    // eslint-disable-next-line no-undef
    let tem;
    while ((tem = reg.exec(htmlStr))) {
      // eslint-disable-next-line no-undef
      arr.push(tem[2]);
    }
    return arr;
  },
  renderSimpleContent(htmlStr, imgLinkArr, videoLinkArr) {
    // console.log('----imgLinkArr-', imgLinkArr);
    const renderStr = [];
    // 去除a标签
    htmlStr = htmlStr.replace(/(<\/?a.*?>)|(<\/?span.*?>)/g, '');
    htmlStr = htmlStr.replace(/(<\/?br.*?>)/g, '\n\n');
    if (imgLinkArr.length > 0 || videoLinkArr.length > 0) {
      // console.log('----1111---')
      let delImgStr, delEndStr;
      const imgReg = /<img[^>]*>/gim;
      const videoReg = /<video[^>]*>/gim;
      if (imgLinkArr.length > 0) {
        delImgStr = htmlStr.replace(imgReg, '|I|');
      } else {
        delImgStr = htmlStr;
      }
      if (videoLinkArr.length > 0) {
        delEndStr = delImgStr.replace(videoReg, '|V|');
      } else {
        delEndStr = delImgStr;
      }
      // console.log('--delEndStr--', delEndStr);
      const imgArr = delEndStr.split('|I|');
      let imgTag = 0,
        videoTag = 0;
      for (let i = 0; i < imgArr.length; i++) {
        const imgItem = imgArr[i];
        // console.log('---imgItem---', imgItem);
        if (imgItem.indexOf('|V|') < 0) {
          // console.log('----i----', imgItem);
          imgItem &&
            renderStr.push({
              type: 'contents',
              content: imgItem,
            });
          if (imgLinkArr[imgTag]) {
            renderStr.push({
              type: 'image',
              content: imgLinkArr[imgTag],
            });
            imgTag++;
          }
        } else {
          // 包含视频片段
          const smVideoArr = imgItem.split('|V|');
          for (let j = 0; j < smVideoArr.length; j++) {
            const smVideoItem = smVideoArr[j];
            smVideoItem &&
              renderStr.push({
                type: 'contents',
                content: smVideoItem,
              });
            if (videoLinkArr[videoTag]) {
              const videoImg = siteFunc.getVideoImgByLink(
                videoLinkArr[videoTag]
              );
              renderStr.push({
                type: 'video',
                content: videoLinkArr[videoTag],
                videoImg,
              });
              videoTag++;
            }
          }
          if (imgLinkArr[imgTag]) {
            renderStr.push({
              type: 'image',
              content: imgLinkArr[imgTag],
            });
            imgTag++;
          }
        }
      }
    } else {
      renderStr.push({
        type: 'contents',
        content: htmlStr,
      });
    }

    return JSON.stringify(renderStr);
  },

  checkContentType(htmlStr, type = 'content') {
    const imgArr = this.getAHref(htmlStr, 'image');
    const videoArr = this.getAHref(htmlStr, 'video');
    const audioArr = this.getAHref(htmlStr, 'audio');

    let defaultType = '0',
      targetFileName = '';
    if (videoArr && videoArr.length > 0) {
      defaultType = '3';
      targetFileName = videoArr[0];
    } else if (audioArr && audioArr.length > 0) {
      defaultType = '4';
      targetFileName = audioArr[0];
    } else if (imgArr && imgArr.length > 0) {
      // 针对帖子有两种 大图 小图
      if (type === 'content') {
        defaultType = (Math.floor(Math.random() * 2) + 1).toString();
      } else if (type === 'class') {
        defaultType = '1';
      }
      targetFileName = imgArr[0];
    } else {
      defaultType = '1';
    }
    let renderLink = targetFileName;
    if (type === '3') {
      // 视频缩略图
      renderLink = siteFunc.getVideoImgByLink(targetFileName);
    }
    return {
      type: defaultType,
      defaultUrl: renderLink,
      imgArr,
      videoArr,
    };
  },
  getVideoImgByLink(link) {
    const oldFileType = link.replace(/^.+\./, '');
    return link.replace('.' + oldFileType, '.jpg');
  },

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

  sendTellMessagesByPhoneNum() {
    console.log('待实现');
  },

  // OPTION_DATABASE_BEGIN
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

  modifyFileByPath(targetPath, replaceStr, targetStr) {
    const readText = fs.readFileSync(targetPath, 'utf-8');
    if (readText.indexOf(replaceStr) >= 0) {
      let reg = new RegExp(replaceStr, 'g');
      if (
        replaceStr.indexOf('path.join') >= 0 ||
        replaceStr.indexOf('"egg-dora') >= 0 ||
        replaceStr.indexOf('"egg-alinode":') >= 0
      ) {
        reg = replaceStr;
      }
      const newRenderContent = readText.replace(reg, targetStr);
      fs.writeFileSync(targetPath, newRenderContent);
    }
  },

  modifyFileByReplace(targetPath, startStr, endStr) {
    const readText = fs.readFileSync(targetPath, 'utf-8');
    if (readText.indexOf(startStr) >= 0 && readText.indexOf(endStr) >= 0) {
      const star = readText.indexOf(startStr);
      const end_ = readText.indexOf(endStr) + endStr.length;
      const startContent = readText.substr(0, star);
      const endContent = readText.substr(end_);
      const newRenderContent = startContent + endContent;
      fs.writeFileSync(targetPath, newRenderContent);
    }
  },

  appendTxtToFileByLine(targetPath, line, targetStr) {
    const fileData = fs.readFileSync(targetPath, 'utf8').split('\n');
    fileData.splice(fileData.length - line, 0, targetStr);
    fs.writeFileSync(targetPath, fileData.join('\n'), 'utf8');
  },

  // 创建文件并写入
  createFileByStr(path, str) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
    if (path && str) {
      fs.writeFileSync(path, str, 'utf8');
    }
  },

  // OPTION_DATABASE_END
};
module.exports = siteFunc;
