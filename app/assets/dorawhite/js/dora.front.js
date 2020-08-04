function watchCreator(id, targetId) {
    getAjaxData('/api/user/followCreator?creatorId=' + id, (data) => {
        if (data.status == 200) {
            $('#' + targetId).find('i').remove();
            $('#' + targetId).text('已关注');
            $('#' + targetId).attr('href', 'javascript:void(0)')
        }
    })
}
// 举报
function reportDocument(contentId, type = '0') {
    getAjaxData('/api/user/report', (data) => {
        if (data.status == 200) {
            layer.msg(data.message, {
                icon: 1,
                time: msgTime,
                anim: 1
            });
        }
    }, 'post', {
        contentId,
        type
    })
}

//兼容方式获取scrolltop以及设置scrolltop
function getScrollTop() {
    var scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
    return scrollTop;
}

// 弹窗初始化
function initCheckModal(vm, msg, callBack) {
    $('#checkIfDo').on('show.bs.modal', function (event) {
        $(this).find('.modal-msg').text(msg);
    }).on('hide.bs.modal', function (event) {

    });
    $('#checkIfDo').modal('show');
    //确认执行删除
    vm.confirmDo = function () {
        $('#checkIfDo').modal('hide');
        callBack();
    };
}

function renderParams(paramObj) {
    let paramStr = '';
    for (let key in paramObj) {
        paramStr += ('&' + key + '=' + paramObj[key])
    }
    return paramStr.substring(1, paramStr.length);
}

// 获取url参数
function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg); //search,查询？后面的参数，并匹配正则
    if (r != null) return unescape(r[2]);
    return null;
}



/**
 * 
 * header avalon controller
 * 
 */

avalon.filters.cutwords = function (str, length) {
    var newStr = "";
    if (!str) return '';
    if (str.replace(/[\u0391-\uFFE5]/g, "aa").length > length) {
        newStr = str.substring(0, length) + '...'
    } else {
        newStr = str;
    }
    return newStr;
}

avalon.filters.formatDateByType = function (date, type) {
    var newStr = "";
    if (type == 'mini') {
        newStr = date.substring(date.length - 8, date.length - 3);
    } else if (type = 'date') {
        newStr = date.substring(0, 9);
    }
    return newStr;
}

avalon.filters.renderJob = function (data, type) {
    var newStr = "",
        askArr = [];
    if (!data) return '';

    if (type == 'industry') {
        askArr = personInfoVm.industryArr;
    } else if (type == 'profession') {
        askArr = personInfoVm.professionArr;
    } else if (type == 'experience') {
        askArr = personInfoVm.experienceArr;
    }
    for (const askItem of askArr) {
        if (askItem.value == data) {
            newStr = askItem.text;
            break;
        }
    }
    return newStr;
}


var searchVm = avalon.define({
    $id: 'headerCtr',
    lsk: [],
    searchkey: '',
    message: '',
    activeSearch: false,
    showErr: false,
    postArticel: function () {
        if ($('#logined').val() == "true") {
            window.location.href = "/users/userAddContent"
        } else {
            window.location.href = "/users/login"
        }
    },
    searchMe: function () {
        searchVm.activeSearch = !searchVm.activeSearch;
    },
    searchOpt: function (e) {
        if (searchVm.searchkey) {
            window.location.href = '/search/' + searchVm.searchkey;
        } else {
            layer.msg(getSysValueByKey('sys_layer_validate_keyword'), {
                icon: 0,
                time: msgTime
            });
        }
    },
    onKeyUp: function (e) {
        if (e && e.keyCode === 13) {
            searchVm.searchOpt()
        }
    }
})

/**
 * 
 * detail avalon controller
 * 
 */

var postArticelVm = avalon.define({
    $id: 'documentInfo',
    message: '',
    showErr: false
})


function askContentThu(askContentThumbsUp) {
    getAjaxData('/api/user/askContentThumbsUp', (data) => {

    })
}
// 推荐帖子静态部分
var rcStaticlVm = avalon.define({
    $id: 'rcStatic',
    askLike: (e, type, targetId) => {
        let oldLinkNum = $('#thumbs_' + targetId).text();
        let oldRewordNum = $('#reword_' + targetId).text();
        let oldDespisesNum = $('#despises_' + targetId).text();
        let oldFavoriteCommunityNum = $('#favoriteCommunity_' + targetId).text();

        if (type == '1') {
            getAjaxData('/api/user/askContentThumbsUp?contentId=' + targetId, (data) => {
                if (data.status == 200) {
                    // layer.msg(data.message, { icon: 1, anim: 1 });
                    $('#thumbs_' + targetId).text(Number(oldLinkNum) + 1);
                }
            })
        } else if (type == '2') { // 踩
            getAjaxData("/api/user/despiseContent?contentId=" + targetId, (data) => {
                if (data.status == 200) {
                    // layer.msg(data.message, { icon: 1, anim: 1 });
                    $('#despises_' + targetId).text(Number(oldDespisesNum) + 1);
                }
            });
        } else if (type == '3') { // 评论
            window.location.href = '/details/' + targetId + '.html?id=comments'
        } else if (type == '4') { //收藏 
            getAjaxData("/api/user/favoriteContent?contentId=" + targetId, (data) => {
                if (data.status == 200) {
                    // layer.msg(data.message, { icon: 1, anim: 1 });
                    $('#favoriteCommunity_' + targetId).text(Number(oldFavoriteCommunityNum) + 1);
                }
            });
        }

    }
})

function getAppendList(type = '1') { // 1增加，2原地刷新

    if (type == '1') {
        appendNewsVm.loadingState = true;
        appendNewsVm.current++;
    } else if (type == '2') {
        appendNewsVm.current = 2;
        appendNewsVm.pageSize = appendNewsVm.current * appendNewsVm.pageSize;
    }
    let appendType = $('#appendType').val();
    let paramsStr = '';
    if (appendType == 'reCommend') {
        paramsStr = '/api/content/getList?type=1&current=' + appendNewsVm.current + '&pageSize=' + appendNewsVm.pageSize + '&isTop=1'
    } else if (appendType == 'hot') {
        paramsStr = '/api/content/getList?type=1&current=' + appendNewsVm.current + '&pageSize=' + appendNewsVm.pageSize + '&sortby=clickNum'
    } else if (appendType == 'community') {
        paramsStr = '/api/community/getCommunityContents?current=' + appendNewsVm.current + '&pageSize=' + appendNewsVm.pageSize + appendNewsVm.current
    } else if (appendType == 'special') {
        paramsStr = '/api/special/getList?current=' + appendNewsVm.current + '&pageSize=' + appendNewsVm.pageSize
    } else if (appendType == 'search') {
        paramsStr = '/api/content/getList?current=' + appendNewsVm.current + '&pageSize=' + appendNewsVm.pageSize + '&searchkey=' + $('#searchkey').val()
    } else if (appendType == 'tag') {
        paramsStr = '/api/content/getList?current=' + appendNewsVm.current + '&pageSize=' + appendNewsVm.pageSize + '&tagName=' + $('#tagName').val()
    } else if (appendType == 'creatorContents') {
        paramsStr = '/api/content/getList?type=1&current=' + appendNewsVm.current + '&pageSize=' + appendNewsVm.pageSize
    }
    getAjaxData(paramsStr, (data) => {
        if (type == '1') {
            appendNewsVm.loadingState = false;
        }
        if (data.data.docs.length > 0) {
            if (type == '1') {
                appendNewsVm.appendDocumentList = (appendNewsVm.appendDocumentList).concat(data.data.docs);
            } else if (type == '2') {
                appendNewsVm.appendDocumentList = data.data.docs;
            }
        } else {
            appendNewsVm.current--
        }
    })
}
// 下拉加载
var appendNewsVm = avalon.define({
    $id: 'appendItems',
    current: 1,
    pageSize: '',
    appendDocumentList: [],
    loadingState: false,
    showAuthor: function (item, author, userName) {
        var obj = item[author]
        if (obj) {
            return obj[userName]
        }
        return ''
    },
    getMoreNews: function () {
        getAppendList();
    },
    appLike: (type, targetId) => {
        if (type == '1') {
            getAjaxData('/api/user/askContentThumbsUp?contentId=' + targetId, (data) => {
                if (data.status == 200) {
                    getAppendList('2');
                }
            })
        } else if (type == '0') {
            getAjaxData("/api/user/rewordContent", (data) => {
                if (data.status == 200) {
                    getAppendList('2');
                }
            }, 'post', {
                coins: 10,
                unit: 'MEC',
                contentId: targetId
            });
        } else if (type == '2') { // 踩
            getAjaxData("/api/user/despiseContent?contentId=" + targetId, (data) => {
                if (data.status == 200) {
                    getAppendList('2');
                }
            });
        } else if (type == '3') { // 评论
            window.location.href = '/details/' + targetId + '.html?id=comments'
        } else if (type == '4') { //收藏 /api/user/favoriteContent
            getAjaxData("/api/user/favoriteContent?contentId=" + targetId, (data) => {
                if (data.status == 200) {
                    getAppendList('2');
                }
            });
        }
    }
})


/**
 * 
 * msgBoard avalon controller
 * 
 */

function getPostMessages() {
    getAjaxData('/api/contentMessage/getMessages?pageSize=100&contentId=' + $('#contentId').val(), (data) => {
        if (data.status == 200) {
            postMsgVm.messageList = data.data.docs;
        }
    })
}
var postMsgVm = avalon.define({
    $id: 'postMessage',
    content: '',
    logined: false,
    message: '',
    showErr: false,
    messageList: [],
    replyState: false,
    relationMsgId: "",
    replyAuthor: "",
    adminReplyAuthor: "",
    praise_num: 0,
    despises_num: 0,
    getAuthor: function (item, adminAuthor, author) {
        if (item) {
            var obj = item[adminAuthor]
            if (obj) {
                return obj
            }
            return item[author] ? item[author] : '';
        } else {
            return ''
        }
    },
    reSetData: function () {
        postMsgVm.content = "";
        postMsgVm.relationMsgId = "";
        postMsgVm.replyAuthor = "";
        postMsgVm.adminReplyAuthor = "";
        postMsgVm.showErr = false;
        postMsgVm.message = "";
    },
    reply: function (id, user, utype) {
        if (id && user) {
            postMsgVm.reSetData();
            postMsgVm.replyState = true;
            postMsgVm.relationMsgId = id;
            if (utype == '0') {
                postMsgVm.replyAuthor = user._id;
            } else {
                postMsgVm.adminReplyAuthor = user._id;
            }
            $("#msgSendBox").appendTo($("#msglist_" + id))
        }
    },
    cancelReply: function () {
        postMsgVm.reSetData();
        postMsgVm.replyState = false;
        $("#postMessage").prepend($('#msgSendBox'));
    },
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                postMsgVm.showErr = true;
                postMsgVm.message = reasons[0].message;
            } else {
                console.log('全部通过');
                if ($('#logined').val() == 'true') {
                    var params = {
                        contentId: $('#contentId').val(),
                        replyAuthor: postMsgVm.replyAuthor,
                        adminReplyAuthor: postMsgVm.adminReplyAuthor,
                        relationMsgId: postMsgVm.relationMsgId,
                        content: postMsgVm.content,
                    }
                    getAjaxData('/api/contentMessage/postMessages', (data) => {
                        if (data.status == 200) {
                            $("#postMessage").prepend($('#msgSendBox'));
                            postMsgVm.reSetData();
                            getPostMessages();
                        }
                    }, 'post', params);
                } else {
                    window.location.href = "/users/login";
                }


            }
        }
    }
})