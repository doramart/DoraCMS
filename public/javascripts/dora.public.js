/**
 * Created by Administrator on 2015/11/16.
 */
$(function(){

    $('#selectAll').click(function(){
        if($(this).prop('checked')){
            $('.datalist input[name=listItem]').prop('checked',true);
        }else{
            $('.datalist input[name=listItem]').prop('checked',false);
        }
        getSelectIds();
    });

});

function getSelectIds(){
    var checkBoxList = $(".datalist input[name='listItem']:checkbox");
    var ids = '';
    if(checkBoxList.length>0){
        $(checkBoxList).each(function(i){
            if (true == $(this).prop("checked")) {
                ids += $(this).prop('value') + ',';
            }
        });
        $('#targetIds').val(ids.substring(0,ids.length - 1));
    }
}


//angularJs https Post方法封装
function angularHttp($http,isValid,method,url,formData,callBack){
    if(isValid){
        $http({
            method  : method,
            url     : url,
            data    : $.param(formData),  // pass in data as strings
            headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
        })
            .success(function(data) {
//                关闭所有模态窗口
                $('.modal').each(function(i){
                    $(this).modal("hide");
                });

                if(data == 'success'){
                    callBack(data);
                }else{
                    $.tipsShow({ message : data, type : 'warning' });
                }
            });
    }
    else{
        alert("参数校验不通过");
    }
}


//初始化上传图片按钮
function initUploadFyBtn(id,key,callBack){
    $("#"+id).uploadify({
        //指定swf文件
        'swf': '/plugins/uploadify/uploadify.swf',
        //后台处理的页面
        'uploader': '/system/upload?type=images&key='+key,
        //按钮显示的文字
        'buttonText': '上传图片',
        //显示的高度和宽度，默认 height 30；width 120
        //'height': 15,
        'width': 80,
        //上传文件的类型  默认为所有文件    'All Files'  ;  '*.*'
        //在浏览窗口底部的文件类型下拉菜单中显示的文本
        'fileTypeDesc': 'Image Files',
        //允许上传的文件后缀
        'fileTypeExts': '*.gif; *.jpg; *.png',
        //发送给后台的其他参数通过formData指定
//                    'formData': { 'type': 'images', 'key': 'ctTopImg' },
        //上传文件页面中，你想要用来作为文件队列的元素的id, 默认为false  自动生成,  不带#
        //'queueID': 'fileQueue',
        //选择文件后自动上传
        'auto': true,
        //设置为true将允许多文件上传
        'multi': true,
        //上传成功
        'onUploadSuccess' : function(file, data, response) {
            callBack(data);
        },
        'onComplete': function(event, queueID, fileObj, response, data) {//当单个文件上传完成后触发
            //event:事件对象(the event object)
            //ID:该文件在文件队列中的唯一表示
            //fileObj:选中文件的对象，他包含的属性列表
            //response:服务器端返回的Response文本，我这里返回的是处理过的文件名称
            //data：文件队列详细信息和文件上传的一般数据
            alert("文件:" + fileObj.name + " 上传成功！");
        },
        //上传错误
        'onUploadError' : function(file, errorCode, errorMsg, errorString) {
            alert('The file ' + file.name + ' could not be uploaded: ' + errorString);
        },
        'onError': function(event, queueID, fileObj) {//当单个文件上传出错时触发
            alert("文件:" + fileObj.name + " 上传失败！");
        }
    });
}