/*
 * @Author: doramart 
 * @Date: 2019-07-07 13:07:27 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-27 14:02:19
 */


const xss = require("xss");
const shortid = require('shortid');
const _ = require('lodash');

const {
    cache,
    siteFunc,
    validatorUtil
} = require('@utils');
const validator = require('validator');
const qr = require('qr-image')

const {
    userService,
    systemConfigService,
    contentTemplateService,
    contentTagService,
    contentService,
    messageService,
    adminUserService,
    contentCategoryService
} = require('@service');

exports.checkContentFormData = (res, fields) => {

    let errMsg = '';

    if (fields._id && !checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }

    if (!validatorUtil.isRegularCharacter(fields.title)) {
        errMsg = res.__("validate_error_field", {
            label: res.__("label_content_title")
        });
    }
    if (!validator.isLength(fields.title, 2, 50)) {
        errMsg = res.__("validate_rangelength", {
            min: 2,
            max: 50,
            label: res.__("label_content_title")
        });
    }
    if (fields.stitle && !validator.isLength(fields.stitle, 2, 50)) {
        errMsg = res.__("validate_rangelength", {
            min: 2,
            max: 50,
            label: res.__("label_content_stitle")
        });
    }
    if (!fields.tags) {
        errMsg = res.__("validate_selectNull", {
            label: res.__("label_content_tags")
        });
    }

    if (!fields.categories) {
        errMsg = res.__("validate_userContent_category");
    }

    if (!fields.sImg) {
        errMsg = res.__("validate_selectNull", {
            label: res.__("lc_small_images")
        });
    }

    if (!validator.isLength(fields.discription, 5, 300)) {
        errMsg = res.__("validate_rangelength", {
            min: 5,
            max: 300,
            label: res.__("label_content_dis")
        });
    }

    if (fields.comments && !validator.isLength(fields.comments, 5, 100000)) {
        errMsg = res.__("validate_rangelength", {
            min: 5,
            max: 100000,
            label: res.__("label_content_comments")
        });
    }

    if (errMsg) {
        throw new Error(errMsg);
    }

}

exports.renderContentList = (res, userId = "", contentList = []) => {

    return new Promise(async (resolve, reject) => {
        try {
            let newContentList = JSON.parse(JSON.stringify(contentList));
            let userInfo;

            if (userId) {
                userInfo = await userService.item(res, {
                    query: {
                        _id: userId
                    },
                    files: getAuthUserFields('session')
                })
            }

            for (let contentItem of newContentList) {
                contentItem.id = contentItem._id;
                contentItem.hasPraised = false;
                contentItem.hasComment = false;
                contentItem.hasFavorite = false;
                contentItem.hasDespise = false;
                contentItem.uAuthor && (contentItem.uAuthor.had_followed = false);

                if (!_.isEmpty(userInfo)) {
                    // 本人是否已点赞
                    if (userInfo.praiseContents && userInfo.praiseContents.indexOf(contentItem._id) >= 0) {
                        contentItem.hasPraised = true;
                    }
                    // 本人是否已收藏
                    if (userInfo.favorites && userInfo.favorites.indexOf(contentItem._id) >= 0) {
                        contentItem.hasFavorite = true;
                    }
                    // 本人是否已踩
                    if (userInfo.despises && userInfo.despises.indexOf(contentItem._id) >= 0) {
                        contentItem.hasDespise = true;
                    }
                    // 本人是否已留言
                    let contentMessage = await messageService.item(res, {
                        query: {
                            contentId: contentItem._id,
                            author: userInfo._id
                        }
                    })
                    if (!_.isEmpty(contentMessage)) {
                        contentItem.hasComment = true;
                    }
                    // 本人是否已关注作者
                    if (userInfo.watchers.length > 0 && contentItem.uAuthor && userInfo.watchers.indexOf(contentItem.uAuthor._id) >= 0) {
                        contentItem.uAuthor.had_followed = true;
                    }
                }

                // 留言总数
                let commentNum = await messageService.count({
                    contentId: contentItem._id
                });
                contentItem.commentNum = commentNum;

                // 点赞总数
                let likeNum = await userService.count({
                    praiseContents: contentItem._id
                })
                contentItem.likeNum = likeNum;

                // 收藏总数
                let favoriteNum = await userService.count({
                    favorites: contentItem._id
                })
                contentItem.favoriteNum = favoriteNum;

                // 踩帖总数
                let despiseNum = await userService.count({
                    despises: contentItem._id
                });
                contentItem.despiseNum = despiseNum;

                if (contentItem.simpleComments) {
                    contentItem.simpleComments = JSON.parse(contentItem.simpleComments);
                }

                // 处理用户敏感信息
                contentItem.uAuthor && siteFunc.clearUserSensitiveInformation(contentItem.uAuthor);

            }

            resolve(newContentList);
        } catch (error) {
            resolve([]);
        }
    })

}

exports.getEnableCateList = async (isSingerPage) => {
    try {
        const enableCates = await contentCategoryService.find({
            isPaging: '0'
        }, {
            query: {
                enable: true,
                type: isSingerPage ? '2' : '1'
            },
            files: 'id'
        })

        let queryCate = enableCates.map((item, index) => {
            const reg = new RegExp(item.id, 'i')
            // return {
            //     categories: {
            //         $regex: reg
            //     }
            // }
            return item.id;
        })
        return queryCate;

    } catch (error) {
        return []
    }
}


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let userId = req.query.userId;
        let userInfo = req.session.user || {};
        let model = req.query.model;
        let sortby = req.query.sortby;
        let listState = req.query.listState || '2';
        let typeId = req.query.typeId;
        let tagName = req.query.tagName;
        let filesType = 'normal'; // 查询模式 full/normal/simple
        let isSingerPage = false; // 是否是单页面

        let queryObj = {
                state: '2'
            },
            sortObj = {
                date: -1
            };


        if (req.query.pageType == 'index') {
            sortObj = {
                roofPlacement: -1,
                date: -1
            };
        }

        if (model == '1') {
            queryObj.isTop = 1;
        }

        if (tagName) {
            let targetTag = await contentTagService.item(res, {
                query: {
                    name: tagName
                }
            });
            if (!_.isEmpty(targetTag)) {
                queryObj.tags = targetTag._id;
                delete queryObj.categories;
            }
        }


        if (sortby == '1') { // 按点击量排序
            delete sortObj.date;
            delete sortObj.roofPlacement;
            sortObj = {
                clickNum: 1
            }
            let rangeTime = getDateStr(-720);
            queryObj.date = {
                "$gte": new Date(rangeTime.startTime),
                "$lte": new Date(rangeTime.endTime)
            }
        }

        // 如果是本人，返回所有文档
        if (!_.isEmpty(userInfo) && userInfo._id == userId) {
            queryObj.uAuthor = userInfo._id;
            if (listState == 'all') {
                delete queryObj.state;
            } else {
                if (listState == '0' || listState == '1' || listState == '2') {
                    queryObj.state = listState;
                }
            }
        } else {
            userId && (queryObj.uAuthor = userId);
        }

        if (typeId) {
            queryObj.categories = typeId
            _.assign(queryObj, {
                categories: typeId
            });
            // 针对顶级分类下挂载的文章
            let singerCate = await contentCategoryService.count({
                _id: typeId,
                enable: true,
                type: '2'
            });
            if (singerCate > 0) {
                filesType = 'stage1';
                isSingerPage = true;
                let ableCateList = await this.getEnableCateList(isSingerPage);
                _.assign(queryObj, {
                    categories: {
                        $in: ableCateList
                    }
                });
            }
        } else {
            // 只查询可见分类的文章
            let ableCateList = await this.getEnableCateList(false);
            _.assign(queryObj, {
                categories: {
                    $in: ableCateList
                }
            });
        }

        // console.log('--sortObj--', sortObj);
        let contentList = await contentService.find(payload, {
            sort: sortObj,
            query: queryObj,
            searchKeys: ['userName', 'title', 'comments', 'discription'],
            files: getContentListFields(filesType)
        });

        contentList.docs = await this.renderContentList(res, userInfo._id, contentList.docs);

        renderSuccess(req, res, {
            data: contentList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}

exports.getTopIndexContents = async (req, res, next) => {
    try {
        let current = req.query.current || 1;
        let pageSize = req.query.pageSize || 10;
        let model = req.query.model || 'normal'; // 查询模式 full/normal/simple
        let userInfo = req.session.user || {};
        let payload = req.query;

        // 条件配置
        let queryObj = {
            state: '2',
            isTop: 1,
            uAuthor: {
                $ne: null
            }
        };

        let sortObj = {
            roofPlacement: -1
        };

        let recContents = [];

        if (!_.isEmpty(userInfo) && !_.isEmpty(userInfo.watchTags) && userInfo.watchTags.length > 0) {
            // 查询置顶文章
            let tagQuery = {
                state: '2',
                $or: [{
                    roofPlacement: 1
                }, {
                    tags: {
                        $in: userInfo.watchTags
                    }
                }]
            };

            let recContentsNum = await contentService.count(tagQuery);
            recContents = await contentService.find(payload, {
                query: tagQuery,
                files: getContentListFields(),
                sort: sortObj
            })

            if (recContentsNum > current * pageSize) {
                recContents.docs = await this.renderContentList(res, userInfo._id, recContents.docs);
                renderSuccess(req, res, {
                    data: recContents
                });
            } else {

                let leftNormalSize = current * pageSize - recContentsNum;
                if (leftNormalSize <= pageSize) {

                    if (leftNormalSize > 0) {
                        let leftContents = await contentService.find({
                            current: 1,
                            pageSize: Number(leftNormalSize)
                        }, {
                            query: {
                                state: '2',
                                tags: {
                                    $nin: userInfo.watchTags
                                }
                            },
                            files: getContentListFields(),
                            sort: sortObj
                        })
                        recContents = _.concat(recContents, leftContents);
                    }

                } else {

                    let leftContents = await contentService.find({
                        skip: leftNormalSize,
                        pageSize: Number(pageSize)
                    }, {
                        query: {
                            state: '2',
                            tags: {
                                $nin: userInfo.watchTags
                            }
                        },
                        files: getContentListFields(),
                        sort: sortObj
                    })
                    recContents = _.concat(recContents, leftContents);
                }

                recContents.docs = await renderContentList(res, userInfo._id, recContents.docs);

                renderSuccess(req, res, {
                    data: recContents
                });

            }

        } else {
            let contents = await contentService.find(payload, {
                query: queryObj,
                files: getContentListFields(),
                sort: sortObj
            })
            contents.docs = await this.renderContentList(res, userInfo._id, contents.docs);

            renderSuccess(req, res, {
                data: contents
            });
        }

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}

// 获取随机文档
exports.getRadomContents = async (req, res, next) => {
    let payload = req.query;
    let queryObj = {
        type: '1',
        state: '2'
    };
    let randomArticles = [];
    try {

        // 只查询可见分类的文章
        let ableCateList = await this.getEnableCateList(false);

        _.assign(queryObj, {
            categories: {
                $in: ableCateList
            }
        });

        const totalContents = await contentService.count(queryObj);

        randomArticles = await contentService.find(_.assign(payload, {
            skip: Math.floor(totalContents * Math.random())
        }), {
            query: queryObj,
            files: 'stitle sImg title'
        })

        renderSuccess(req, res, {
            data: randomArticles
        });
    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}



exports.getOneContent = async (req, res, next) => {


    try {
        let targetId = req.query.id;
        let userId = req.query.userId;

        if (!shortid.isValid(targetId)) {
            throw new Error(res.__('validate_error_params'));
        }

        let queryObj = {
            _id: targetId,
            state: '2',
            uAuthor: {
                $ne: null
            }
        };

        let userInfo = req.session.user || {};

        // 查询自己的文章不需要约束状态
        if (!_.isEmpty(userInfo) && userInfo._id == userId) {
            delete queryObj.state;
            queryObj.uAuthor = userId;
        }

        await contentService.inc(res, targetId, {
            'clickNum': 1
        })

        let targetContent = await contentService.item(res, {
            query: queryObj,
            files: getContentListFields()
        });

        let renderContent = Array(targetContent);
        renderContent = await this.renderContentList(res, userInfo._id, renderContent);

        renderSuccess(req, res, {
            data: renderContent[0]
        });

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}


exports.getMyFavoriteContents = async (req, res, next) => {
    try {


        let payload = req.query;
        let userInfo = req.session.user;

        let queryObj = {
            state: '2'
        };

        let targetUser = await userService.item(res, {
            query: {
                _id: userInfo._id
            }
        })
        queryObj._id = {
            $in: targetUser.favorites
        }

        let favoriteContentsData = await contentService.find(payload, {
            query: queryObj,
            searchKeys: ['name'],
            files: getContentListFields()
        })

        favoriteContentsData.docs = await this.renderContentList(res, userInfo._id, favoriteContentsData.docs);

        renderSuccess(req, res, {
            data: favoriteContentsData
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}


exports.addContent = async (req, res, next) => {

    try {

        let fields = req.body;

        this.checkContentFormData(res, fields);

        let targetKeyWords = [];
        if (fields.keywords) {
            if ((fields.keywords).indexOf(',') >= 0) {
                targetKeyWords = (fields.keywords).split(',');
            } else if ((fields.keywords).indexOf('，') >= 0) {
                targetKeyWords = (fields.keywords).split('，');
            }
        }

        const contentFormObj = {
            title: fields.title,
            stitle: fields.stitle,
            type: fields.type,
            categories: fields.categories,
            sortPath: fields.sortPath,
            tags: fields.tags,
            keywords: targetKeyWords,
            sImg: fields.sImg,
            author: !_.isEmpty(req.session.adminUserInfo) ? req.session.adminUserInfo._id : '',
            state: fields.state,
            dismissReason: fields.dismissReason,
            isTop: fields.isTop,
            discription: xss(fields.discription),
            comments: fields.comments,
            simpleComments: xss(fields.simpleComments),
            likeUserIds: [],
            type: fields.type
        }

        // 设置显示模式
        let checkInfo = siteFunc.checkContentType(contentFormObj.simpleComments);
        contentFormObj.appShowType = checkInfo.type;
        contentFormObj.imageArr = checkInfo.imgArr;
        contentFormObj.videoArr = checkInfo.videoArr;
        if (checkInfo.type == '3') {
            contentFormObj.videoImg = checkInfo.defaultUrl;
        }

        contentFormObj.simpleComments = siteFunc.renderSimpleContent(contentFormObj.simpleComments, checkInfo.imgArr, checkInfo.videoArr);

        // TODO 临时控制普通用户添加1天内不超过30篇
        let rangeTime = getDateStr(-1);
        let hadAddContentsNum = await contentService.count({
            uAuthor: req.session.user._id,
            date: {
                "$gte": new Date(rangeTime.startTime),
                "$lte": new Date(rangeTime.endTime)
            }
        });

        if (hadAddContentsNum > 30) {
            throw new Error(res.__("validate_forbid_more_req"));
        }

        contentFormObj.comments = xss(fields.comments);
        contentFormObj.tags = Array(contentFormObj.tags);
        contentFormObj.stitle = contentFormObj.title;
        contentFormObj.uAuthor = req.session.user._id;
        if (fields.draft == '1') {
            contentFormObj.state = '0'
        } else {
            contentFormObj.state = '1'
        }
        contentFormObj.author = '';

        let newContent = contentService.create(contentFormObj);

        renderSuccess(req, res, {
            data: {
                id: newContent._id
            }
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }

}

exports.updateContent = async (req, res, next) => {

    try {

        let fields = req.body;

        this.checkContentFormData(res, fields);

        let targetContent = await contentService.item(res, {
            query: {
                uAuthor: req.session.user._id
            }
        })

        if (_.isEmpty(targetContent)) {
            throw new Error(res.__('validate_error_params'));
        }

        const contentObj = {
            title: fields.title,
            stitle: fields.stitle || fields.title,
            type: fields.type,
            categories: fields.categories,
            sortPath: fields.sortPath,
            tags: fields.tags,
            keywords: fields.keywords ? (fields.keywords).split(',') : [],
            sImg: fields.sImg,
            author: !_.isEmpty(req.session.adminUserInfo) ? req.session.adminUserInfo._id : '',
            state: fields.state,
            dismissReason: fields.dismissReason,
            isTop: fields.isTop || '',
            discription: xss(fields.discription),
            comments: fields.comments,
            simpleComments: xss(fields.simpleComments),
            type: fields.type
        }

        // 设置显示模式
        let checkInfo = siteFunc.checkContentType(contentObj.simpleComments);
        contentObj.appShowType = checkInfo.type;
        contentObj.imageArr = checkInfo.imgArr;
        contentObj.videoArr = checkInfo.videoArr;

        contentObj.simpleComments = siteFunc.renderSimpleContent(contentObj.simpleComments, checkInfo.imgArr, checkInfo.videoArr);

        if (checkInfo.type == '3') {
            contentObj.videoImg = checkInfo.defaultUrl;
        }

        contentObj.comments = xss(fields.comments);
        contentObj.stitle = contentObj.title;
        contentObj.uAuthor = req.session.user._id;

        if (fields.draft == '1') {
            contentObj.state = '0'
        } else {
            contentObj.state = '1'
        }
        contentObj.author = '';
        contentObj.updateDate = new Date();

        await contentService.update(res, fields.id, contentObj);

        renderSuccess(req, res, {
            data: {}
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }

}

exports.getContentQr = async (req, res, next) => {

    try {
        let detailLink = req.query.detailLink;
        if (detailLink) {
            let img = qr.image(detailLink, {
                size: 10
            });
            res.writeHead(200, {
                'Content-Type': 'image/png'
            });
            img.pipe(res);
        } else {
            throw new Error(res.__('validate_error_params'));
        }
    } catch (e) {
        res.writeHead(414, {
            'Content-Type': 'text/html'
        });
        res.end('<h1>414 Request-URI Too Large</h1>');
    }
}

// 随机获取图片
exports.getRandomContentImg = async (req, res, next) => {
    try {

        let payload = req.query;
        let pageSize = req.query.pageSize || 1;
        let queryObj = {
            type: '1',
            state: '2'
        };

        // 只查询可见分类的文章
        let ableCateList = await this.getEnableCateList(false);
        _.assign(queryObj, {
            categories: {
                $in: ableCateList
            }
        });

        const totalContents = await contentService.count(queryObj);
        let randomArticles = await contentService.find(_.assign(payload, {
            isPaging: '0',
            pageSize,
            skip: Math.floor(totalContents * Math.random())
        }), {
            query: queryObj,
            files: 'sImg'
        })

        let sImgArr = [];

        for (const articleItem of randomArticles) {
            if (articleItem.sImg) {
                sImgArr.push(articleItem.sImg);
            }
        }

        renderSuccess(req, res, {
            data: sImgArr
        });

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}