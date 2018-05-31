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

});


function loginOut() {
    $.ajax({
        url: "/users/logout",
        method: "GET",
        success: function (result) {
            if (result.status === 200) {
                window.location = "/"
            } else {
                alert("未知异常，请稍后重试");
            }
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


toastr.options = { debug: false, positionClass: 'toast-top-center', timeOut: '2000', showMethod: "fadeIn", hideMethod: "fadeOut" }
var searchVm = avalon.define({
    $id: 'headerCtr',
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
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8', // 很重要
                    traditional: true,
                    data: JSON.stringify(params),
                    url: 'api/admin/doLogin',
                    success: function (data) {
                        console.log('success:', data)
                        if (data.status == 200) {
                            window.location.href = "/manage";
                        } else {
                            adminLoginVm.showErr = true;
                            adminLoginVm.message = data.message;
                            adminLoginVm.reSetImgCode();
                        }
                    },
                    error: function (d) {
                        console.log('error:', d)
                    }
                })
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
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8',
                    traditional: true,
                    data: JSON.stringify(params),
                    url: '/users/sentConfirmEmail',
                    success: function (data) {
                        console.log('success:', data)
                        if (data.status == 200) {
                            toastr.success(data.message);
                            window.location.href = "/";
                        } else {
                            confirmEmailVm.showErr = true;
                            confirmEmailVm.message = data.message;
                        }
                    },
                    error: function (d) {
                        console.log('error:', d)
                    }
                })
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
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8', // 很重要
                    traditional: true,
                    data: JSON.stringify(params),
                    url: '/users/doLogin',
                    success: function (data) {
                        console.log('success:', data)
                        if (data.status == 200) {
                            window.location.href = "/ ";
                        } else {
                            loginVm.showErr = true;
                            loginVm.message = data.message;
                        }
                    },
                    error: function (d) {
                        console.log('error:', d)
                    }
                })
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
    $.ajax({
        type: "GET",
        url: '/api/message/getList?pageSize=100&contentId=' + $('#contentId').val(),
        success: function (data) {
            console.log('success:', data)
            if (data.status == 200) {
                postMsgVm.messageList = data.data.docs;
            }
        },
        error: function (d) {
            console.log('error:', d)
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
                    $.ajax({
                        type: 'POST',
                        contentType: 'application/json; charset=utf-8', // 很重要
                        traditional: true,
                        data: JSON.stringify(params),
                        url: '/users/message/post',
                        success: function (data) {
                            console.log('success:', data)
                            if (data.status == 200) {
                                $("#postMessage").prepend($('#msgSendBox'));
                                postMsgVm.reSetData();
                                getPostMessages();
                            } else {
                                postMsgVm.showErr = true;
                                postMsgVm.message = data.message;
                            }
                        },
                        error: function (d) {
                            console.log('error:', d)
                        }
                    })
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
    $.ajax({
        type: "GET",
        url: '/users/' + api + '?current=' + current,
        success: function (data) {
            console.log('data', data);
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
    deleteNotify: function (id) {
        initCheckModal(myContentsVm, '确认删除该条记录吗？', function () {
            $.ajax({
                type: "GET",
                data: { ids: id },
                url: '/users/delUserNotify',
                success: function (data) {
                    console.log('data', data);
                    if (data.status == 200) {
                        toastr.success("恭喜，删除成功!");
                        getUserRelevantList('getUserNotifys', 'myMessages', 1)
                    } else {
                        toastr.error(data.message);
                    }
                }
            })
        });
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
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8', // 很重要
                    traditional: true,
                    data: JSON.stringify(params),
                    url: '/users/doReg',
                    success: function (data) {
                        console.log('success:', data)
                        if (data.status == 200) {
                            toastr.success("{{lk.lc_reg_success_tip}}");
                            window.location.href = "/";
                        } else {
                            regVm.showErr = true;
                            regVm.message = data.message;
                        }
                    },
                    error: function (d) {
                        console.log('error:', d)
                    }
                })
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
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8', // 很重要
                    traditional: true,
                    data: JSON.stringify(params),
                    url: '/users/updateNewPsd',
                    success: function (data) {
                        console.log('success:', data)
                        if (data.status == 200) {
                            toastr.success(data.message);
                            window.location.href = "/users/login";
                        } else {
                            reSetPsdVm.showErr = true;
                            reSetPsdVm.message = data.message;
                        }
                    },
                    error: function (d) {
                        console.log('error:', d)
                    }
                })
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
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8', // 很重要
                    traditional: true,
                    data: JSON.stringify(params),
                    url: '/users/postEmailToAdminUser',
                    success: function (data) {
                        if (data.status == 200) {
                            toastr.success(data.message);
                            setTimeout(function () {
                                window.location.href = "/";
                            }, 2000)
                        } else {
                            toastr.error(data.message);
                        }
                    },
                    error: function (d) {
                        toastr.error(d);
                    }
                })
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
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8', // 很重要
                    traditional: true,
                    data: JSON.stringify(params),
                    url: '/users/updateInfo',
                    success: function (data) {
                        console.log('success:', data)
                        if (data.status == 200) {
                            toastr.success("更新成功!");
                        } else {
                            setPsdVm.showErr = true;
                            setPsdVm.message = data.message;
                        }
                    },
                    error: function (d) {
                        console.log('error:', d)
                    }
                })
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
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8', // 很重要
                    traditional: true,
                    data: JSON.stringify(params),
                    url: '/users/updateInfo',
                    success: function (data) {
                        console.log('success:', data)
                        if (data.status == 200) {
                            toastr.success(data.message);
                        } else {
                            toastr.error(data.message);
                        }
                    },
                    error: function (d) {
                        console.log('error:', d)
                    }
                })
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
