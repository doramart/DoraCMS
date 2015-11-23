/*
前后台公用js*/

$(function(){

    //用户注销
    $('#userLoginOut').click(function () {
        loginOut();
    });

    //    返回顶部
    $('#gotop').click(function(){
        $('body,html').animate({scrollTop:0},800);
        return false;
    });

    //    监听滚动条位置
    $(window).scroll(function(event) {
        if(getScrollTop() > 100){
            $('#gotop').css('opacity' , 0.3);
        }else{
            $('#gotop').css('opacity' , 0);
        }
    });

});


function loginOut(){
    $.ajax({
        url: "/users/logout",
        method: "GET",
        success: function (result) {
            if (result === "success") {
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

/*滑动组件
* adsId 广告id
* containerId 自定义广告容器ID
* showPoint 是否显示小圆点 默认false
* */

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
                    var imgContent = data.content;
                    var imgList = imgContent.replace(/},/g,"};").split(";");
                    var imgItems = "";
                    var imgIcons = "";
                    for(var i=0;i<imgList.length;i++){
                        var item = JSON.parse(imgList[i]);
                        if(i==0){
                            imgIcons += "<li data-target='#carousel-example-generic' data-slide-to='0' class='active'></li>";
                            imgItems += "<div class='item active'><a href='"+item.link+"' target='"+item.target+"'><img width='"+item.width+"' height='"+item.height+"' src='"+item.sImg+"' alt='"+item.discription+"'></a></div>";
                        }
                        else{
                            imgIcons += "<li data-target='#carousel-example-generic' data-slide-to='"+i+"'></li>";
                            imgItems += "<div class='item'><a href='"+item.link+"' target='"+item.target+"'><img width='"+item.width+"' height='"+item.height+"' src='"+item.sImg+"' alt='"+item.discription+"'></a></div>";
                        }
                    }
                    adsTemp(imgItems,imgIcons,jsonData,imgList.length);
                }else{
                    var contentObj = JSON.parse(data.content);
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

//初始化删除操作
function initDelOption($scope,$http,currentPage,info){

    $scope.getNewIds = function(){
        getSelectIds();
    };

//    批量删除
    $scope.batchDel = function(){
        var targetIds = $('#targetIds').val();
        if(targetIds && targetIds.split(',').length > 0){
            initCheckIfDo($scope,info,function(){
                $http.get("/users/"+currentPage+"/batchDel?ids="+targetIds).success(function(result){
                    $('.modal').each(function(i){
                        $(this).modal("hide");
                    });
                    if(result == 'success'){
                        window.location.reload();
                    }else{
                        alert(result);
                    }
                });
            });
        }else{
            alert('请至少选择一项')
        }
    }

}

//提示用户操作窗口
function initCheckIfDo($scope,msg,callBack){
    $('#checkIfDo').on('show.bs.modal', function (event) {
        $(this).find('.modal-msg').text(msg);
    }).on('hide.bs.modal', function (event) {

    });
    $('#checkIfDo').modal('show');
    //确认执行删除
    $scope.confirmDo = function () {
        callBack();
    };
}