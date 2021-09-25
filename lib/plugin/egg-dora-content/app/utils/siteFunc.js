/*
 * @Author: doramart
 * @Date: 2019-09-25 14:16:44
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-18 18:14:10
 */
'use strict';
const siteFunc = {
  // 筛选内容中的url
  getAHref(htmlStr, type = 'image') {
    let reg = /<img.+?src=('|")?([^'"]+)('|")?(?:\s+|>)/gim;
    if (type === 'video') {
      reg = /<video.+?src=('|")?([^'"]+)('|")?(?:\s+|>)/gim;
    } else if (type === 'audio') {
      reg = /<audio.+?src=('|")?([^'"]+)('|")?(?:\s+|>)/gim;
    }
    const arr = [];
    let tem;
    // eslint-disable-next-line no-undef
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
              const videoImg = this.getVideoImgByLink(videoLinkArr[videoTag]);
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
      renderLink = this.getVideoImgByLink(targetFileName);
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
};
module.exports = siteFunc;
