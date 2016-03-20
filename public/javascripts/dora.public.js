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
    var nids = '';
    if(checkBoxList.length>0){
        $(checkBoxList).each(function(i){
            if (true == $(this).prop("checked")) {
                ids += $(this).prop('value') + ',';
                if($(this).attr('nid')){
                    nids += $(this).attr('nid') + ',';
                }

            }
        });
        $('#targetIds').val(ids.substring(0,ids.length - 1));
        $('#expandIds').val(nids.substring(0,nids.length - 1));
    }
}


//angularJs https Post方法封装
function angularHttpPost($http,isValid,url,formData,callBack){
    if(isValid){
        $http({
            method  : 'POST',
            url     : url,
            data    : $.param(formData),  // pass in data as strings
            headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
        })
        .success(function(data) {
            //  关闭所有模态窗口
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
        $.tipsShow({ message : "参数校验不通过", type : 'warning' });
    }
}


/*初始化上传图片按钮
* id 初始化上传按钮
* type 文件类型
* key 上传对象是所属 管理员头像、用户头像、文档首图等，后台根据key来进行不同规格的图片压缩
* */
function initUploadFyBtn(id,type,key,callBack){

    var typedes = 'Image Files';
    var filtertype = '*.gif; *.jpg; *.png';
    var buttonText = '上传图片';
    var uploadApi = '/system/upload';
    var autoUpdate = true;
    var sizeLimit = 1024 * 1024 * 1;
    var adminId = $('#adminId').val();
    var buttonWidth = 100;
    var buttonStyle = 'uploadify-btn-default';
    if(type == 'zip'){
        typedes = 'Zip Files';
        filtertype = '*.zip';
        buttonText = '安装本地模板(*.zip)';
        uploadApi = '/admin/manage/updateCMSTemplate';
        sizeLimit = 1024 * 1024 * 3;
        buttonWidth = 130;
        buttonStyle = 'uploadify-btn-primary';
    }
    $("#"+id).uploadify({
        //指定swf文件
        'swf': '/plugins/uploadify/uploadify.swf',
        //后台处理的页面
        'uploader': uploadApi + '?adminId='+adminId+'&type='+type+'&key='+key,
        //按钮显示的文字
        'buttonText': buttonText,
        'buttonClass' : buttonStyle,
        //显示的高度和宽度，默认 height 30；width 120
        //'height': 15,
        'width': buttonWidth,
        //上传文件的类型  默认为所有文件    'All Files'  ;  '*.*'
        //在浏览窗口底部的文件类型下拉菜单中显示的文本
        'fileTypeDesc': typedes,
        //允许上传的文件后缀
        'fileTypeExts': filtertype,
        //发送给后台的其他参数通过formData指定
        //'formData': { 'adminUserId' : adminUserId , 'type': type, 'key': key},
        sizeLimit :sizeLimit,
    //上传文件页面中，你想要用来作为文件队列的元素的id, 默认为false  自动生成,  不带#
        //'queueID': 'fileQueue',
        //选择文件后自动上传
        'auto': autoUpdate,
        //设置为true将允许多文件上传
        'multi': false,
        //上传成功
        'onUploadSuccess' : function(file, data, response) {
            if(data === 'typeError'){
                $.tipsShow({
                    message : "文件类型不正确，请重试！",
                    type : 'warning',
                    callBack : function(){
                        return;
                    }
                });
            }else {
                callBack(data);
            }
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

/*滑动组件
 * adsId 广告id
 * containerId 自定义广告容器ID
 * showPoint 是否显示小圆点 默认false
 *
*/

function initSlides(jsonData){
    var jsonData = jsonData || {};
    jsonData.adsId = jsonData.adsId || '';
    jsonData.containerId = jsonData.containerId || '';
    jsonData.showPoint = jsonData.showPoint || false;
    if(jsonData.adsId && jsonData.containerId){
        this.init(jsonData);
    }
}

initSlides.prototype = {

    init : function(jsonData){
        $.ajax({
            url:"/content/requestAds/ads/item?uid="+jsonData.adsId,
            type:"get",
            dataType:"json",
            success:function(data){
                if(!data){
                    return;
                }
                if(data.type === "1"){
                    //var imgContent = data.content;
                    var imgList = data.items;
                    var imgItems = "";
                    var imgIcons = "";
                    for(var i=0;i<imgList.length;i++){
                        var item = imgList[i];
                        if(i==0){
                            imgIcons += "<li data-target='#carousel-example-generic' data-slide-to='0' class='active'></li>";
                            imgItems += "<div class='item active'><a href='"+item.link+"' target='"+item.target+"'><img width='"+item.width+"' height='"+item.height+"' src='"+item.sImg+"' alt='"+item.alt+"'></a></div>";
                        }
                        else{
                            imgIcons += "<li data-target='#carousel-example-generic' data-slide-to='"+i+"'></li>";
                            imgItems += "<div class='item'><a href='"+item.link+"' target='"+item.target+"'><img width='"+item.width+"' height='"+item.height+"' src='"+item.sImg+"' alt='"+item.alt+"'></a></div>";
                        }
                    }
                    adsTemp(imgItems,imgIcons,jsonData,imgList.length);
                }else{
                    var contentObj = data.items[0];
                    var txtHtml = "";
                    txtHtml += "<a href='"+contentObj.link+"' target='_blank'><i class='fa fa-tags'></i>"+contentObj.title+"</a>";
                    $("#"+jsonData.containerId).html(txtHtml);
                }

            }
        });
    }
};

function adsTemp(imgItems,imgIcons,jsonData,imgListLength){

    var adsHtml = "";
    adsHtml += "<div id='carousel-example-generic' class='carousel slide' data-ride='carousel'>";
    adsHtml += "	<ol class='carousel-indicators'>";
    if(jsonData.showPoint){
        adsHtml += imgIcons;
    }
    adsHtml += "	</ol>";
    adsHtml += "	<div class='carousel-inner' role='listbox'>";
    adsHtml += imgItems;
    adsHtml += "	</div>";
    if(imgListLength > 1){
        adsHtml += "	<a class='left carousel-control' href='#carousel-example-generic' role='button' data-slide='prev'>";
        adsHtml += "		<span class='glyphicon glyphicon-chevron-left' aria-hidden='true'></span>";
        adsHtml += "		<span class='sr-only'>Previous</span>";
        adsHtml += "	</a>";
        adsHtml += "	<a class='right carousel-control' href='#carousel-example-generic' role='button' data-slide='next'>";
        adsHtml += "		<span class='glyphicon glyphicon-chevron-right' aria-hidden='true'></span>";
        adsHtml += "		<span class='sr-only'>Next</span>";
        adsHtml += "	</a>";
    }
    adsHtml += "</div>";

    $("#"+jsonData.containerId).html(adsHtml);

}