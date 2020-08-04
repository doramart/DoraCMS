/*
前后台公用js*/
$(function () {
    // 国际化信息存储
    window.__lk = '';
    let currentKeys = $('#sysKeys').val();
    if (currentKeys) {
        window.__lk = JSON.parse($('#sysKeys').val());
        $('#sysKeys').remove();
    }
    //用户注销
    $('#userLoginOut').click(function () {
        loginOut();
    });

    //    返回顶部1
    $('#gotop').click(function () {
        $('body,html').animate({
            scrollTop: 0
        }, 800);
        return false;
    });

    function getScrollTop() {
        var scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
        return scrollTop;
    }

    //    监听滚动条位置
    $(window).scroll(function (event) {
        if (getScrollTop() > 200) {
            $('#gotop').css('opacity', 1);
        } else {
            $('#gotop').css('opacity', 0);
        }
    });

})

let msgTime = 800;
layer.config({
    extend: 'blue/layer.css', //加载您的扩展样式,它自动从theme目录下加载这个文件
    skin: 'layui-layer-blue' //layui-layer-orange这个就是上面我们定义css 的class
});

function checkIfMobile() {
    if ((navigator.userAgent.match(
            /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
        ))) {
        return true;
    } else {
        return false;
    }
}

function getAjaxData(url, success = () => {}, type = 'get', params = {}, error = () => {}) {
    layer.load(2, {
        shade: [0.3, '#000']
    });
    let baseParams = {
        url: url,
        type: type.toLocaleUpperCase(),
        success: function (result) {
            layer.closeAll('loading');
            if (result.status === 500) {
                layer.msg(result.message, {
                    icon: 2,
                    shade: [0.001, '#000'],
                    zIndex: 999999999,
                    time: msgTime
                });
                error && error();
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
            layer.closeAll('loading');
            let message = d.message || 'Server error!'
            layer.msg(message, {
                icon: 2,
                time: msgTime
            });
        }
    };
    if (type == 'post') {
        baseParams = Object.assign({}, baseParams, {
            // contentType: 'application/json; charset=utf-8',
            // traditional: true,
            data: params,
        })
    } else {
        if (url.indexOf('?') >= 0) {
            baseParams.url = url;
        } else {
            baseParams.url = url;
        }
    }
    $.ajax(baseParams);
}

function getSysValueByKey(key) {
    // let currentKeys = $('#sysKeys').val();
    if (window.__lk) {
        // let sysLcList = JSON.parse($('#sysKeys').val());
        return window.__lk[key];
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
            getAjaxData('/api/user/logOut', (data) => {
                if (data.status == 200) {
                    layer.msg(data.message, {
                        icon: 1,
                        time: msgTime
                    }, function () {
                        window.location = "/"
                    });
                }
            })
        }
    })
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

var _oldValuesOfPersonInfoVM = {} // 用于保存旧的数据，取消时还原
var personInfoVm = avalon.define({
    $id: 'personInfo',
    message: '',
    showErr: false,
    industry: '',
    introduction: '',
    profession: '1',
    experience: '1',
    comments: '',
    gender: '0',
    userName: '',
    userId: '',
    selected: '1',
    follow_num: 0,
    total_despiseNum: 0,
    total_likeNum: 0,
    total_reward_num: 0,
    approveCreatorIndentify: () => {
        layer.alert(getSysValueByKey('label_system_waitfor_update'));
    },
    industryArr: [],
    professionArr: [],
    experienceArr: [],
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                console.log('有表单没有通过', reasons)
                layer.msg(reasons[0].message, {
                    icon: 2,
                    shade: [0.001, '#000'],
                    time: msgTime
                });
            } else {
                console.log('全部通过');
                let params = {};
                if (personInfoVm.userName) {
                    params.userName = personInfoVm.userName;
                }
                if (personInfoVm.introduction) {
                    params.introduction = personInfoVm.introduction;
                }
                if (personInfoVm.gender) {
                    params.gender = personInfoVm.gender;
                }
                if (personInfoVm.profession) {
                    params.profession = personInfoVm.profession;
                }
                if (personInfoVm.industry) {
                    params.industry = personInfoVm.industry;
                }
                if (personInfoVm.experience) {
                    params.experience = personInfoVm.experience;
                }
                if (personInfoVm.label_introduction) {
                    params.label_introduction = personInfoVm.label_introduction;
                }
                if (personInfoVm.comments) {
                    params.comments = personInfoVm.comments;
                }
                if ($(".form_datetime").data("datetimepicker").getDate()) {
                    params.birth = $(".form_datetime").data("datetimepicker").getDate();
                }
                getAjaxData('/api/user/updateInfo', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, {
                            icon: 1,
                            time: msgTime
                        });
                        personInfoVm.getUserInfo(personInfoVm.userId);
                    }
                }, 'post', params);
            }
        }
    },
    getUserInfo: (id) => {
        getAjaxData('/api/user/getUserInfoById?id=' + id, (data) => {
            let {
                id,
                industry,
                profession,
                experience,
                comments,
                gender,
                userName,
                birth,
                introduction,
                follow_num,
                total_despiseNum,
                total_likeNum,
                total_reward_num,
            } = data.data;
            personInfoVm.introduction = introduction || '';
            personInfoVm.industry = industry || '';
            personInfoVm.profession = profession || '';
            personInfoVm.experience = experience || '';
            personInfoVm.comments = comments || '';
            personInfoVm.gender = gender;
            personInfoVm.userName = userName;
            personInfoVm.userId = id;
            personInfoVm.follow_num = follow_num;
            personInfoVm.total_despiseNum = total_despiseNum;
            personInfoVm.total_likeNum = total_likeNum;
            personInfoVm.total_reward_num = total_reward_num;
            if (birth) {
                // $('#user_birthday').val(birth);
                $('.form_datetime').datetimepicker('update', birth);
            }
        })
    },
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
                getAjaxData('/api/user/sentConfirmEmail', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, {
                            icon: 1,
                            anim: 1,
                            time: msgTime
                        }, function () {
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

var userTellLoginVm = avalon.define({
    $id: 'userTellLogin',
    phoneNum: '',
    countryCode: '',
    message: '',
    showErr: false,
    basetime: 120,
    targetPanel: '1',
    reset: function () {
        userTellLoginVm.phoneNum = " ";
        userTellLoginVm.messageCode = " ";
    },
    messageCode: '',
    lateResendTxt: ' s',
    reSendBtnTxt: getSysValueByKey('label_system_resend'),
    sendMsgCode: function () {
        if (userTellLoginVm.basetime != 120) {
            return false;
        }
        if (!/^[0-9]*$/.test(userTellLoginVm.phoneNum)) {
            layer.open({
                content: getSysValueByKey('sys_layer_validate_phoneNum'),
                skin: 'msg',
                time: 1,
                anim: false
            });
        } else {
            $('#get-v-code').prop('disabled', 'disabled')
            // 开始发短信
            var smsParams = {
                phoneNum: userTellLoginVm.phoneNum,
                countryCode: userTellLoginVm.countryCode || '86',
                messageType: '1',
            }
            getAjaxData('/api/user/sendVerificationCode', function (data) {

                var mytask = setInterval(function () {
                    $('#get-v-code').html(--userTellLoginVm.basetime + userTellLoginVm.lateResendTxt);
                }, 1000)
                setTimeout(function () {
                    clearInterval(mytask);
                    $('#get-v-code').removeAttr('disabled');
                    $('#get-v-code').html(getSysValueByKey('label_system_resend'));
                    userTellLoginVm.basetime = 120;
                    //clearMessageCode();
                }, 1000 * userTellLoginVm.basetime);
            }, 'post', smsParams)
        }
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
                // userTellLoginVm.showErr = true;
                // userTellLoginVm.message = reasons[0].message;
                layer.msg(reasons[0].message, {
                    icon: 2,
                    shade: [0.001, '#000'],
                    time: msgTime
                });
            } else {
                console.log('全部通过');
                var params = {
                    loginType: '1',
                    phoneNum: userTellLoginVm.phoneNum,
                    messageCode: userTellLoginVm.messageCode,
                    countryCode: userTellLoginVm.countryCode || '86'
                }
                getAjaxData('/api/user/doLogin', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, {
                            icon: 1,
                            time: 1,
                            time: msgTime
                        }, function () {
                            window.location.href = "/ ";
                        });
                    }
                }, 'post', params);

            }
        }
    }
})

var userPwdLoginVm = avalon.define({
    $id: 'userPwdLogin',
    password: '',
    countryCode: '',
    phoneNum: '',
    message: '',
    showErr: false,
    reset: function () {
        userPwdLoginVm.phoneNum = " ";
        userPwdLoginVm.password = " ";
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
                // userPwdLoginVm.showErr = true;
                // userPwdLoginVm.message = reasons[0].message;
                layer.msg(reasons[0].message, {
                    icon: 2,
                    shade: [0.001, '#000'],
                    time: msgTime
                });
            } else {
                console.log('全部通过');
                var params = {
                    loginType: '2',
                    countryCode: userTellLoginVm.countryCode,
                    phoneNum: userPwdLoginVm.phoneNum,
                    password: userPwdLoginVm.password,
                }
                getAjaxData('/api/user/doLogin', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, {
                            icon: 1,
                            time: msgTime
                        }, function () {
                            window.location.href = "/ ";
                        });
                    }
                }, 'post', params);
            }
        }
    }
})

var userEmailLoginVm = avalon.define({
    $id: 'userEmailLogin',
    email: '',
    message: '',
    showErr: false,
    targetPanel: '3',
    reset: function () {
        userEmailLoginVm.email = " ";
        userEmailLoginVm.messageCode = " ";
    },
    password: '',
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                layer.msg(reasons[0].message, {
                    icon: 2,
                    shade: [0.001, '#000'],
                    time: msgTime
                });
            } else {
                console.log('全部通过');
                var params = {
                    loginType: '3',
                    email: userEmailLoginVm.email,
                    password: userEmailLoginVm.password,
                }
                getAjaxData('/api/user/doLogin', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, {
                            icon: 1,
                            time: 1,
                            time: msgTime
                        }, function () {
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
 * myContents avalon controller
 * 
 */
function getUserRelevantList(api, dctype, current, params = {}) {
    let otherStr = '';
    if (params) {
        otherStr = renderParams(params);
    }
    getAjaxData('/api' + api + '?current=' + current + '&' + otherStr, (data) => {
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
        getUserRelevantList('/content/getUserContents', 'myContents', cur, {
            userId: $('#userId').val(),
            listState: 'all'
        })
    },
    messagePageClick: function (e, cur) {
        getUserRelevantList('/systemNotify/getUserNotifys', 'myMessages', cur, {
            userId: $('#userId').val()
        })
    },
    joinTopicPageClick: function (e, cur) {
        getUserRelevantList('/contentMessage/getMessages', 'myJoinTopics', cur, {
            userId: $('#userId').val()
        })
    },
    showMessageDetails: function (e, el) {
        e.preventDefault();
        var targetDom = e.target;
        $(targetDom).toggleClass('fa-angle-down');
        $(targetDom).parent().next().toggleClass('show');
        if (!el.isRead) {
            getAjaxData('/api/systemNotify/setNoticeRead?ids=' + el.id, (data) => {
                if (data.status == 200) {
                    getUserRelevantList('/systemNotify/getUserNotifys', 'myMessages', 1)
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
                getAjaxData('/api/systemNotify/delUserNotify?ids=' + id, (data) => {
                    if (data.status == 200) {
                        layer.msg(getSysValueByKey('sys_layer_option_success'), {
                            icon: 1
                        }, function () {
                            getUserRelevantList('/systemNotify/getUserNotifys', 'myMessages', 1)
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
    $id: 'regAction',
    regType: '2',
    userName: '',
    phoneNum: '',
    email: '',
    password: '',
    countryCode: '',
    message: '',
    showErr: false,
    basetime: 120,
    targetPanel: '1',
    reset: function () {
        regVm.userName = "";
        regVm.email = "";
        regVm.phoneNum = "";
        regVm.messageCode = "";
        regVm.password = "";
    },
    messageCode: '',
    lateResendTxt: ' s',
    reSendBtnTxt: getSysValueByKey('label_system_resend'),
    mytask: '',
    clearSmsBtn: function () {
        if (regVm.task) {
            clearInterval(regVm.mytask);
            $('#vCodeBtn').removeAttr('disabled');
            $('#vCodeBtn').html(getSysValueByKey('label_system_resend'));
            regVm.basetime = 120;
        }
        regVm.reset();
    },
    sendMsgCode: function () {
        if (regVm.basetime != 120) {
            return false;
        }

        if (regVm.regType == '1') {
            if (!/^[0-9]*$/.test(regVm.phoneNum)) {
                layer.open({
                    content: getSysValueByKey('sys_layer_validate_phoneNum'),
                    skin: 'msg'
                });
                return false
            }
        } else if (regVm.regType == '2') {
            if (!/^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/.test(regVm.email)) {
                layer.open({
                    content: getSysValueByKey('sys_layer_validate_email'),
                    skin: 'msg'
                });
                return false
            }
        }

        if (!regVm.password) {
            layer.open({
                content: getSysValueByKey('sys_layer_validate_password'),
                skin: 'msg'
            });
            return false
        }

        $('.vCodeBtn').prop('disabled', 'disabled')
        // 开始发验证码
        var smsParams = {
            messageType: '0',
            sendType: regVm.regType
        }
        if (regVm.regType == '1') {
            smsParams.phoneNum = regVm.phoneNum;
            smsParams.countryCode = regVm.countryCode || '86';
        } else if (regVm.regType == '2') {
            smsParams.email = regVm.email;
        }
        getAjaxData('/api/user/sendVerificationCode', function (data) {

            layer.msg('已发送验证码', {
                icon: 1,
                time: msgTime
            });
            regVm.mytask = setInterval(function () {
                $('.vCodeBtn').html(--regVm.basetime + regVm.lateResendTxt);
            }, 1000)
            setTimeout(function () {
                clearInterval(regVm.mytask);
                $('.vCodeBtn').removeAttr('disabled');
                $('.vCodeBtn').html(getSysValueByKey('label_system_resend'));
                regVm.basetime = 120;
                //clearMessageCode();
            }, 1000 * regVm.basetime);
        }, 'post', smsParams)

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
                // regVm.showErr = true;
                // regVm.message = reasons[0].message;
                layer.msg(reasons[0].message, {
                    icon: 2,
                    shade: [0.001, '#000'],
                    time: msgTime
                });
            } else {
                console.log('全部通过');
                var params = {
                    regType: regVm.regType,
                    password: regVm.password,
                    messageCode: regVm.messageCode,
                };
                if (regVm.regType == '1') {
                    params.phoneNum = regVm.phoneNum;
                    params.countryCode = regVm.countryCode || '86';
                } else if (regVm.regType == '2') {
                    params.email = regVm.email;
                    params.userName = regVm.userName;
                }
                getAjaxData('/api/user/doReg', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, {
                            icon: 1,
                            time: msgTime
                        }, function () {
                            window.location.href = "/users/login";
                        });
                    }
                }, 'post', params, () => {
                    regVm.clearSmsBtn();
                });

            }
        }
    }
})



var getBackPsdVm = avalon.define({
    $id: 'getBackPsd',
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
                getBackPsdVm.showErr = true;
                getBackPsdVm.message = reasons[0].message;
            } else {
                console.log('全部通过');
                var params = {
                    tokenId: $('#tokenId').val(),
                    confirmPassword: getBackPsdVm.confirmPassword,
                    password: getBackPsdVm.password
                }
                getAjaxData('/api/user/updateNewPsd', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, {
                            icon: 1
                        }, function () {
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
 * reSetPassword avalon controller
 * 
 */


var reSetPsdVm = avalon.define({
    $id: 'reSetPsd',
    password: '',
    confirmPassword: '',
    phoneNum: '',
    countryCode: '',
    messageCode: '',
    message: '',
    showErr: false,
    basetime: 120,
    targetPanel: '1',
    reset: function () {
        reSetPsdVm.phoneNum = " ";
        reSetPsdVm.messageCode = " ";
    },
    messageCode: '',
    lateResendTxt: ' s',
    reSendBtnTxt: getSysValueByKey('label_system_resend'),
    sendMsgCode: function () {
        if (reSetPsdVm.basetime != 120) {
            return false;
        }
        if (!/^[0-9]*$/.test(reSetPsdVm.phoneNum)) {
            layer.msg(getSysValueByKey('sys_layer_validate_phoneNum'), {
                icon: 1,
                time: msgTime
            })
        } else {
            $('#get-v-code').prop('disabled', 'disabled')
            // 开始发短信
            var smsParams = {
                phoneNum: reSetPsdVm.phoneNum,
                countryCode: reSetPsdVm.countryCode || '86',
                messageType: '3',
            }
            getAjaxData('/api/user/sendVerificationCode', function () {
                var mytask = setInterval(function () {
                    $('#get-v-code').html(--reSetPsdVm.basetime + reSetPsdVm.lateResendTxt);
                }, 1000)
                setTimeout(function () {
                    clearInterval(mytask);
                    $('#get-v-code').removeAttr('disabled');
                    $('#get-v-code').html(getSysValueByKey('label_system_resend'));
                    reSetPsdVm.basetime = 120;
                    //clearMessageCode();
                }, 1000 * reSetPsdVm.basetime);
            }, 'post', smsParams)
        }
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
                reSetPsdVm.showErr = true;
                reSetPsdVm.message = reasons[0].message;
                // layer.msg(reasons[0].message, { icon: 2, shade: [0.001, '#000'] });
            } else {
                console.log('全部通过');
                var params = {
                    password: reSetPsdVm.password,
                    confirmPassword: reSetPsdVm.confirmPassword,
                    phoneNum: reSetPsdVm.phoneNum,
                    messageCode: reSetPsdVm.messageCode,
                    countryCode: reSetPsdVm.countryCode || '86'
                }
                getAjaxData('/api/user/resetPassword', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, {
                            icon: 1,
                            time: msgTime
                        }, function () {
                            window.location.href = "/ ";
                        });
                    }
                }, 'post', params);

            }
        }
    }
})

var reSetPsdByEmailVm = avalon.define({
    $id: 'reSetPsdByEmail',
    password: '',
    confirmPassword: '',
    email: '',
    messageCode: '',
    message: '',
    showErr: false,
    basetime: 120,
    targetPanel: '1',
    reset: function () {
        reSetPsdByEmailVm.email = " ";
    },
    messageCode: '',
    lateResendTxt: ' s',
    reSendBtnTxt: getSysValueByKey('label_system_resend'),
    sendMsgCode: function () {
        if (reSetPsdByEmailVm.basetime != 120) {
            return false;
        }
        if (!/^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/.test(reSetPsdByEmailVm.email)) {
            layer.msg(getSysValueByKey('sys_layer_validate_email'), {
                icon: 1,
                time: msgTime
            })
            return false;
        } else {
            $('#get-v-code').prop('disabled', 'disabled')
            // 开始发验证码
            var smsParams = {
                email: reSetPsdByEmailVm.email,
                sendType: '2',
                messageType: '3',
            }
            getAjaxData('/api/user/sendVerificationCode', function () {
                var mytask = setInterval(function () {
                    $('#get-v-code').html(--reSetPsdByEmailVm.basetime + reSetPsdByEmailVm.lateResendTxt);
                }, 1000)
                setTimeout(function () {
                    clearInterval(mytask);
                    $('#get-v-code').removeAttr('disabled');
                    $('#get-v-code').html(getSysValueByKey('label_system_resend'));
                    reSetPsdByEmailVm.basetime = 120;
                    //clearMessageCode();
                }, 1000 * reSetPsdByEmailVm.basetime);
            }, 'post', smsParams)
        }
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
                reSetPsdByEmailVm.showErr = true;
                reSetPsdByEmailVm.message = reasons[0].message;
                // layer.msg(reasons[0].message, { icon: 2, shade: [0.001, '#000'] });
            } else {
                console.log('全部通过');
                var params = {
                    password: reSetPsdByEmailVm.password,
                    confirmPassword: reSetPsdByEmailVm.confirmPassword,
                    email: reSetPsdByEmailVm.email,
                    messageCode: reSetPsdByEmailVm.messageCode,
                    type: '2'
                }
                getAjaxData('/api/user/resetPassword', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, {
                            icon: 1,
                            time: msgTime
                        }, function () {
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
                getAjaxData('/api/user/updateInfo', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, {
                            icon: 1,
                            time: msgTime
                        });
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
                getAjaxData('/api/user/updateInfo', (data) => {
                    if (data.status == 200) {
                        layer.msg(data.message, {
                            icon: 1
                        });
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
    currentPath: window.location.pathname,
    menu_body_2_show: () => {
        return userNavVm.currentPath.indexOf('personInfo') > 0 ||
            userNavVm.currentPath.indexOf('setUserPsd') > 0
    },
    menu_body_1_show: () => {
        return userNavVm.currentPath.indexOf('userContents') > 0 ||
            userNavVm.currentPath.indexOf('joinComments') > 0 ||
            userNavVm.currentPath.indexOf('notify') > 0 ||
            userNavVm.currentPath.indexOf('userAddContent') > 0
    }
})