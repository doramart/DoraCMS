/*
前后台公用js*/
$(function () {
    //用户注销
    $('#userLoginOut').click(function () {
        loginOut();
    });

    //    返回顶部1
    $('#gotop').click(function () {
        $('body,html').animate({ scrollTop: 0 }, 800);
        return false;
    });

    //    监听滚动条位置
    $(window).scroll(function (event) {
        if (getScrollTop() > 100) {
            $('#gotop').css('opacity', 1);
        } else {
            $('#gotop').css('opacity', 0);
        }
    });

})

layer.config({
    extend: 'blue/layer.css', //加载您的扩展样式,它自动从theme目录下加载这个文件
    skin: 'layui-layer-blue'  //layui-layer-orange这个就是上面我们定义css 的class
});

function getAjaxData(url, success = () => { }, type = 'get', params = {}) {
    layer.load(1, { shade: [0.3, '#000'] });
    let baseParams = {
        url: url,
        type: type.toLocaleUpperCase(),
        success: function (result) {
            layer.closeAll();
            if (result.status === 500) {
                layer.msg(result.message, { icon: 2, shade: [0.001, '#000'] });
            } else if (result.status === 401) {
                layer.confirm(result.message, {
                    title: getSysValueByKey('sys_layer_confirm_title'),
                    btn: getSysValueByKey('sys_layer_confirm_btn_yes'),
                    yes: function (index) {
                        layer.close(index);
                    }
                })
            } else {
                success && success(result);
            }
        },
        error: function (d) {
            console.log('error:', d)
            layer.msg(d.message, { icon: 2 });
        }
    };
    if (type == 'post') {
        baseParams = Object.assign({}, baseParams, {
            contentType: 'application/json; charset=utf-8',
            traditional: true,
            data: JSON.stringify(params),
        })
    }
    $.ajax(baseParams);
}

function getSysValueByKey(key) {
    let currentKeys = $('#sysKeys').val();
    if (currentKeys) {
        let sysLcList = JSON.parse($('#sysKeys').val());
        return sysLcList[key];
    } else {
        return '';
    }
}

function loginOut() {
    layer.confirm(getSysValueByKey('sys_layer_confirm_logOut'), {
        title: getSysValueByKey('sys_layer_confirm_title'),
        btn: getSysValueByKey('sys_layer_confirm_btn_yes'),
        yes: function (index) {
            layer.close(index);
            getAjaxData('/users/logOut', (data) => {
                if (data.status == 200) {
                    layer.msg(data.message, { icon: 1 }, function () {
                        window.location = "/"
                    });
                }
            })
        }
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
            if (e.keyCode == 13) {
                window.location.href = '/search/' + searchVm.searchkey;
            }
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

/**
 * 
 * adminlogin avalon controller
 * 
 */
var adminLoginVm = avalon.define({
    $id: 'adminUserlogin',
    password: '',
    userName: '',
    message: '',
    imageCode: "",
    showErr: false,
    imgCodeUrl: "/api/getImgCode",
    reSetImgCode: function () {
        adminLoginVm.imgCodeUrl = "/api/getImgCode?" + Math.random();
    },
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                console.log('有表单没有通过', reasons)
                adminLoginVm.showErr = true;
                adminLoginVm.message = reasons[0].message;
            } else {
                console.log('全部通过');
                var params = {
                    userName: adminLoginVm.userName,
                    password: CryptoJS.MD5('dora' + adminLoginVm.password).toString(),
                    imageCode: adminLoginVm.imageCode
                }
                getAjaxData('/api/admin/doLogin', (data) => {
                    if (data.status == 200) {
                        window.location.href = "/manage";
                    } else {
                        adminLoginVm.showErr = true;
                        adminLoginVm.message = data.message;
                        adminLoginVm.reSetImgCode();
                    }
                }, 'post', params)
            }
        }
    }
})

/**
 * 
 * confirmEmail avalon controller
 * 
 */
var confirmEmailVm = avalon.define({
    $id: 'confirmEmail',
    email: '',
    message: '',
    showErr: false,
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                console.log('有表单没有通过', reasons)
                confirmEmailVm.showErr = true;
                confirmEmailVm.message = reasons[0].message;
            } else {
                console.log('全部通过');
                var params = {
                    email: confirmEmailVm.email
                }
                getAjaxData('/users/sentConfirmEmail', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, { icon: 1, anim: 1 }, function () {
                            window.location.href = "/";
                        });
                    } else {
                        confirmEmailVm.showErr = true;
                        confirmEmailVm.message = data.message;
                    }
                }, 'post', params);
            }
        }
    }
})

/**
 * 
 * login avalon controller
 * 
 */

var loginVm = avalon.define({
    $id: 'userlogin',
    password: '',
    email: '',
    message: '',
    showErr: false,
    reset: function () {
        loginVm.email = " ";
        loginVm.password = " ";
    },
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                console.log('有表单没有通过', reasons)
                loginVm.showErr = true;
                loginVm.message = reasons[0].message;
            } else {
                console.log('全部通过');
                var params = {
                    email: loginVm.email,
                    password: loginVm.password
                }
                getAjaxData('/users/doLogin', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, { icon: 1 }, function () {
                            window.location.href = "/ ";
                        });
                    }
                }, 'post', params);

            }
        }
    }
})

/**
 * 
 * msgBoard avalon controller
 * 
 */

function getPostMessages() {
    getAjaxData('/api/message/getList?pageSize=100&contentId=' + $('#contentId').val(), (data) => {
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
    getAuthor: function (item, adminAuthor, author) {
        var obj = item[adminAuthor]
        if (obj) {
            return obj
        }
        return item[author] ? item[author] : '';
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
        postMsgVm.reSetData();
        postMsgVm.replyState = true;
        postMsgVm.relationMsgId = id;
        if (utype == '0') {
            postMsgVm.replyAuthor = user._id;
        } else {
            postMsgVm.adminReplyAuthor = user._id;
        }
        $("#msgSendBox").appendTo($("#msglist_" + id))
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
                    var params = postMsgVm.$model;
                    params.contentId = $('#contentId').val();
                    delete params.messageList;
                    getAjaxData('/users/message/post', (data) => {
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

/**
 * 
 * myContents avalon controller
 * 
 */
function getUserRelevantList(api, dctype, current) {
    getAjaxData('/users/' + api + '?current=' + current, (data) => {
        if (data.status == 200) {
            if (dctype == 'myContents') {
                myContentsVm.myContentList = data.data.docs;
                myContentsVm.contentTotalPage = data.data.pageInfo.totalPage;
            } else if (dctype == 'myMessages') {
                myContentsVm.myMessageList = data.data.docs;
                myContentsVm.messageTotalPage = data.data.pageInfo.totalPage;
            } else if (dctype == 'myJoinTopics') {
                myContentsVm.myJoinTopicsList = data.data.docs;
                myContentsVm.joinTopicsTotalPage = data.data.pageInfo.totalPage;
            }
        }
    })
}


var myContentsVm = avalon.define({
    $id: 'my-contents',
    myContentList: [],
    myMessageList: [],
    myJoinTopicsList: [],
    contentTotalPage: 1,
    messageTotalPage: 1,
    joinTopicsTotalPage: 1,
    contentPageClick: function (e, cur) {
        getUserRelevantList('getUserContents', 'myContents', cur)
    },
    messagePageClick: function (e, cur) {
        getUserRelevantList('getUserNotifys', 'myMessages', cur)
    },
    joinTopicPageClick: function (e, cur) {
        getUserRelevantList('getUserReplies', 'myJoinTopics', cur)
    },
    showMessageDetails: function (e, el) {
        e.preventDefault();
        var targetDom = e.target;
        $(targetDom).toggleClass('fa-angle-down');
        $(targetDom).parent().next().toggleClass('show');
        if (!el.isRead) {
            getAjaxData('/users/setNoticeRead?ids=' + el.id, (data) => {
                if (data.status == 200) {
                    getUserRelevantList('getUserNotifys', 'myMessages', 1)
                }
            });
        }
    },
    deleteNotify: function (id) {
        layer.confirm(getSysValueByKey('sys_layer_confirm_delete'), {
            title: getSysValueByKey('sys_layer_confirm_title'),
            btn: getSysValueByKey('sys_layer_confirm_btn_yes'),
            yes: function (index) {
                layer.close(index);
                getAjaxData('/users/delUserNotify?ids=' + id, (data) => {
                    if (data.status == 200) {
                        layer.msg(getSysValueByKey('sys_layer_option_success'), { icon: 1 }, function () {
                            getUserRelevantList('getUserNotifys', 'myMessages', 1)
                        });
                    }
                })
            }
        })
    }
})

/**
 * 
 * reg avalon controller
 * 
 */

var regVm = avalon.define({
    $id: 'reglogin',
    userName: '',
    password: '',
    confirmPassword: '',
    email: '',
    message: '',
    showErr: false,
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                console.log('有表单没有通过', reasons)
                regVm.showErr = true;
                regVm.message = reasons[0].message;
            } else {
                console.log('全部通过');
                var params = {
                    userName: regVm.userName,
                    email: regVm.email,
                    password: regVm.password,
                    confirmPassword: regVm.confirmPassword
                }
                getAjaxData('/users/doReg', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, { icon: 1 }, function () {
                            window.location.href = "/";
                        });
                    }
                }, 'post', params)

            }
        }
    }
})

/**
 * 
 * reSetPassword avalon controller
 * 
 */


var reSetPsdVm = avalon.define({
    $id: 'reSetPsd',
    password: '',
    confirmPassword: '',
    message: '',
    showErr: false,
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                console.log('有表单没有通过', reasons)
                reSetPsdVm.showErr = true;
                reSetPsdVm.message = reasons[0].message;
            } else {
                console.log('全部通过');
                var params = {
                    tokenId: $('#tokenId').val(),
                    confirmPassword: reSetPsdVm.confirmPassword,
                    password: reSetPsdVm.password
                }
                getAjaxData('/users/updateNewPsd', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, { icon: 1 }, function () {
                            window.location.href = "/users/login";
                        });
                    }
                }, 'post', params);
            }
        }
    }
})

/**
 * 
 * sendEmail avalon controller
 * 
 */
var sendEmailInfoVm = avalon.define({
    $id: 'email-user-info',
    name: '',
    email: '',
    comments: '',
    phoneNum: '',
    message: '',
    showErr: false,
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                console.log('有表单没有通过', reasons)
                sendEmailInfoVm.showErr = true;
                sendEmailInfoVm.message = reasons[0].message;
            } else {
                console.log('全部通过');
                var params = {
                    email: sendEmailInfoVm.email,
                    name: sendEmailInfoVm.name,
                    phoneNum: sendEmailInfoVm.phoneNum,
                    comments: sendEmailInfoVm.comments
                }
                getAjaxData('/users/postEmailToAdminUser', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, { icon: 1 }, function () {
                            window.location.href = "/";
                        });
                    }
                }, 'post', params);
            }
        }
    }
})

/**
 * 
 * setPsd avalon controller
 * 
 */
var setPsdVm = avalon.define({
    $id: 'setPsd',
    password: '',
    confirmPassword: '',
    message: '',
    showErr: false,
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                console.log('有表单没有通过', reasons)
                setPsdVm.showErr = true;
                setPsdVm.message = reasons[0].message;
            } else {
                console.log('全部通过');
                var params = {
                    confirmPassword: setPsdVm.confirmPassword,
                    password: setPsdVm.password
                }
                getAjaxData('/users/updateInfo', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, { icon: 1 });
                    }
                }, 'post', params);

            }
        }
    }
})

/**
 * 
 * uInfo avalon controller
 * 
 */

var userInfoVm = avalon.define({
    $id: 'user-info',
    userName: '',
    name: '',
    email: '',
    comments: '',
    phoneNum: '',
    message: '',
    showErr: false,
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                console.log('有表单没有通过', reasons)
                userInfoVm.showErr = true;
                userInfoVm.message = reasons[0].message;
            } else {
                console.log('全部通过');
                var params = {
                    userName: userInfoVm.userName,
                    email: userInfoVm.email,
                    name: userInfoVm.name,
                    phoneNum: userInfoVm.phoneNum,
                    comments: userInfoVm.comments
                }
                getAjaxData('/users/updateInfo', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, { icon: 1 });
                    }
                }, 'post', params)
            }
        }
    }
})

/**
 * 
 * userNav avalon controller
 * 
 */
var userNavVm = avalon.define({
    $id: 'user-nav',
    currentPath: window.location.pathname
})

    /**
     * 
     * userAddContent avalon controller
     * 
     */
// });