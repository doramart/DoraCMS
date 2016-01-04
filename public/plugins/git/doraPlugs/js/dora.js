/**
 * Created by Administrator on 2015/10/20.
 */
//禁止滚动事件
function stopScroll(event){
    event.preventDefault();
}

//初始化alert,dialog等容器位置
function setContainerPosition(obj){

    var uitype = $(obj).attr('ui-type');
    if(uitype == 'alert' || uitype == 'tips' || uitype == 'block'){
        var $clone = $(obj).clone().css('display', 'block').appendTo('body');
        var top = Math.round((document.documentElement.clientHeight - $clone.height()) / 2);
        var left = Math.round((document.documentElement.clientWidth - $clone.width()) / 2);
        top = top > 0 ? top : 0;
        left = left > 0 ? left : 0;
        $clone.remove();
        $(obj).css({
            "top" : top,
            "left" : left
        });
    }

}

/*
 * block控件
 * 指定block对象的属性message
 * message : 信息提示内容(string/obj)
 * */

//创建弹窗
$.block = function (jsonData) {
    var currentObj = new blockObj(jsonData);
};

//关闭弹窗
$.unblock = function () {
    if ($("[ui-type='block']").length > 0) {
        $('body').find('.doraui_mask').remove();
        document.body.removeEventListener('touchmove', stopScroll , false);
        $("[ui-type='block']").each(function (i) {
            if ($(this).attr('msg-type') == 'obj') {
                $(this).children().eq(0).hide();
                $(this).children().eq(0).unwrap();
            } else {
                $(this).remove();
            }
        });
    }
};

var blockObj = function (jsonData) {

    var objId = "block_" + Math.round(Math.random() * 100);
    jsonData = jsonData || {};
    jsonData.message = jsonData.message || '<p>请稍后...</p>';
    jsonData.overClass = jsonData.overClass || 'block-a';
    jsonData.mask = jsonData.mask || false;
    this.html = blockHtml(objId, jsonData);
    this.init(objId, jsonData);
};

blockObj.prototype = {
//    block初始化
    init: function (objId, jsonData) {
        var _this = this;

        if (jsonData.message instanceof jQuery) {
            $(jsonData.message).wrap(this.html);
            _this.obj = $('#' + objId);
            $(_this.obj).attr('msg-type', 'obj');
            $(_this.obj).show();
            $(jsonData.message).show();
        } else {
            $('body').prepend(this.html);
            _this.obj = $('#' + objId);
            $(_this.obj).attr('msg-type', 'str');
            $(jsonData.message).appendTo(_this.obj);
        }

//        设置容器的居中显示
        $(_this.obj).css({
            'width' : $(_this.obj).width() +'px',
            'left' : '50%',
            'top' : '50%',
            'margin-left' : - $(_this.obj).width()/2 + 'px',
            'margin-top' : - $(_this.obj).height()/2 + 'px'
        });

        var maskOpacity = 1;
        if(!jsonData.mask){
            maskOpacity = 0;
        }
        $("<div class='doraui_mask' style='z-index: 10;opacity:"+maskOpacity+" '></div>").insertBefore(_this.obj);
        $(_this.obj).css('z-index', 11);
//        禁止背景拖动
        document.body.addEventListener('touchmove', stopScroll , false);

    }
};


function blockHtml(objId, jsonData) {
    var html = "";
    html += "<div class='block " + jsonData.overClass + "' ui-type='block' id='" + objId + "'></div>";
    return html;
}


/*
 * tips 操作提示控件
 * 指定tips对象的属性message
 * type : 信息提示类型 success 操作成功 warning 警告 danger 危险 info 提示
 * message : 信息提示内容(string/obj)
 * */

$.tipsShow = function (jsonData) {
    var currentObj = new tipsObj(jsonData);
};

$.tipsHide = function (obj) {
    $(obj).remove();
    document.body.removeEventListener('touchmove', stopScroll , false);
};

var tipsObj = function (jsonData) {
    var objId = "tips_" + Math.round(Math.random() * 100);
    jsonData = jsonData || {};
    jsonData.type = jsonData.type || 'success';
    jsonData.delay = jsonData.delay || 1500;
    jsonData.message = jsonData.message || '操作成功！';
    jsonData.overClass = jsonData.overClass || 'tips-a';
    jsonData.callBack = jsonData.callBack || '';
    this.html = tipsHtml(objId, jsonData);
    this.init(objId,jsonData.delay,jsonData.callBack);
};

tipsObj.prototype = {
    // tips初始化
    init: function (objId,delay,callBack) {
        var _this = this;

        $('body').prepend(this.html);
        _this.obj = $('#' + objId);
        var closeBtn = $(_this.obj).find('.close');
        var confirmBtn = $(_this.obj).find('.confirm');
        // 设置容器的居中显示
        setContainerPosition(_this.obj);
        $(_this.obj).css('z-index', 99999);
        document.body.addEventListener('touchmove', stopScroll , false);
        setTimeout(function () {
            $(_this.obj).animate({
                'opacity': 0
            }, 1000, function () {
                $(_this.obj).remove();
                document.body.removeEventListener('touchmove', stopScroll , false);
                if(callBack){
                    callBack();
                }
            });
        }, delay);
    }
};

function tipsHtml(objId, jsonData) {
    var html = "";
    var typeStr = 'check-right';
    if (jsonData.type == "info") {
        typeStr = 'notice-up';
    }else if(jsonData.type == "warning"){
        typeStr = 'notice-down'
    }else if(jsonData.type == "danger"){
        typeStr = 'notice-triangle'
    }
    html += "<div class='tips " + jsonData.overClass + "' ui-type='tips' id='" + objId + "'>";
    html += "<div class='tips-content'>";
    html += "<i class='icon-"+ typeStr +"'></i>";
    html += "&nbsp;<span class='tips-info'>" + jsonData.message + "</span></div>";
    html += "</div>";
    return html;
}
