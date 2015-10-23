$(function(){
//    全选
   $(':checkbox').prop('checked',false);
   $('#targetIds').val('');
   $('#selectAll').click(function(){
       if($(this).prop('checked')){
           $('.datalist > td > input[name=listItem]').prop('checked',true);
       }else{
           $('.datalist > td > input[name=listItem]').prop('checked',false);
       }
       getSelectIds();
   });

});

function getSelectIds(){
    var checkBoxList = $(".datalist td input[name='listItem']:checkbox");
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

//字符串转换函数
//adminUser=true&adminGroup=true 转json对象
function changeDataTOJson(obj){
    var oldVal = obj.toString();
    var cg1 = oldVal.replace(/=/g, "':");
    var changeObj = "{'"+cg1 .replace(/&/g, ",'")+"}";
    return eval("(" + changeObj + ")");
}


//将后台获取的list解析为tree对象所需的json数据
function changeToTreeJson(result,key,oldValue){
    var arrTree = [];
    var treeItem;
    for(var i=0;i<result.length;i++){
        if(key === "tags" || key === "filmTypes"){
            var checkState = false;
            var tagsArr = oldValue.split(",");
            for(var j=0;j<tagsArr.length;j++){
                if(result[i].name === tagsArr[j].toString()){
                    checkState = true;
                    break;
                }
            }
            treeItem = new TagsTree(result[i]._id,result[i].name,checkState);

        }else if(key === "temps"){
            treeItem = new TempsTree(result[i]._id,result[i].name,result[i].alias);
        }else if(key === "tempForders"){
            treeItem = new TempsTree(0,result[i].name,"");
        }else{
//            alert(result[i].name+"--"+result[i].parentID)
            treeItem = new TreeInfo(result[i]._id,result[i].parentID,result[i].name,result[i].sortPath,result[i].homePage,result[i].contentTemp,true,false);
        }
        arrTree.push(treeItem);
    }
    return arrTree;
}

//获取指定类别ID对应的名称

function getCateNameById(result,id){

    for(var i=0;i<result.length;i++){

        if(result[i]._id === id){
            return result[i].name;
        }

    }
    return "请选择类别";
}


function getCateNameByAlias(result,id){

    for(var i=0;i<result.length;i++){

        if(result[i].name === id){
            return result[i].name;
        }
    }
    return "请选择类别";
}


//    创建树对象结构
function TreeInfo(id,pId,name,sortPath,homePage,contentTemp,open,click){
    this.id = id;
    this.pId = pId;
    this.name = name;
    this.contentTemp = contentTemp;
    this.sortPath = sortPath;
    this.homePage = homePage;
    this.open = open;
    this.click = click;
}

// 创建标签树对象结构
function TagsTree(id,name,checked){
    this.id=id;
    this.name=name;
    this.checked=checked;
}

//创建模板树对象结构
function TempsTree(id,name,alias){
    this.id=id;
    this.name=name;
    this.alias=alias;
}


//ztree 节点取消选中
function cancelTreeCheckBoxSelect(id){
    var treeObj = $.fn.zTree.getZTreeObj(id),
        checkedNodes = treeObj.getCheckedNodes(true);
    for (var i=0, l=checkedNodes.length; i < l; i++) {
        treeObj.checkNode(checkedNodes[i], false, true);
    }
}


//初始化分页
function initPagination($scope,$http,currentPage,searchKey){

    $("#dataLoading").removeClass("hide");
    $scope.selectPage = [
        {name:'10',value : '10'},
        {name:'20',value : '20'},
        {name:'30',value : '30'}
    ];

    $scope.limitNum = '10';
    $scope.currentPage = 1;
    $scope.totalPage = 1;
    $scope.totalItems = 1;
    $scope.limit = 10;
    $scope.pages = [];
    $scope.startNum = 1;
    $scope.keywords = searchKey;
    getPageInfos($scope,$http,"/admin/manage/getDocumentList/"+currentPage);
}


//翻页组件
function getPageInfos($scope,$http,url){

//        定义翻页动作
    $scope.loadPage = function(page){
        $scope.currentPage = page;
        getPageInfos($scope,$http,url)
    };

    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.totalPage) {
            $scope.currentPage++;
            getPageInfos($scope,$http,url);
        }
    };

    $scope.prevPage = function () {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            getPageInfos($scope,$http,url);
        }
    };

    $scope.changeOption = function(){

        $scope.limit = Number($scope.limitNum);
        getPageInfos($scope,$http,url);
    };

    $http.get(url+"?limit="+$scope.limit+"&currentPage="+$scope.currentPage+"&searchKey="+$scope.keywords).success(function(result){
        console.log("getData success!");
        $scope.data = result.docs;
        if(result.pageInfo){
            $scope.totalItems = result.pageInfo.totalItems;
            $scope.currentPage = result.pageInfo.currentPage;
            $scope.limit = result.pageInfo.limit;
            $scope.startNum = result.pageInfo.startNum;
            //获取总页数
            $scope.totalPage = Math.ceil($scope.totalItems / $scope.limit);
            //生成数字链接
            var pageNum =  Number($scope.currentPage);
            if ($scope.currentPage > 1 && $scope.currentPage < $scope.totalPage) {
                $scope.pages = [
                    $scope.currentPage - 1,
                    $scope.currentPage,
                    $scope.currentPage + 1
                ];
            }
            else if ($scope.currentPage == 1 && $scope.totalPage == 1) {
                    $scope.pages = [
                    $scope.currentPage

                ];
            }
            else if ($scope.currentPage == 1 && $scope.totalPage > 1) {
                $scope.pages = [
                    $scope.currentPage,
                    $scope.currentPage + 1
                ];
            } else if ($scope.currentPage == $scope.totalPage && $scope.totalPage > 1) {
                $scope.pages = [
                    $scope.currentPage - 1,
                    $scope.currentPage
                ];
            }
        }else{
            console.log("获取分页信息失败")
        }

        $("#dataLoading").addClass("hide");

    })
}

//新增广告中的图片信息模型

function getImgInfo(imgUrl,link,width,height,target,details){
    var html = "";
    var listId = "imgInfo_"+Math.round(Math.random()*100);
    var scale = width + "*" + height;
    html += "<div class='alert alert-info fade in' id='"+listId+"'>";
    html += "<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>";
    html += "<div class='col-sm-3'>";
    html += "<img src='"+imgUrl+"' alt='' class='img-thumbnail'/><br/><br/>";
//    html += "<button class='btn btn-primary btn-xs hide'><span class='fa fa-fw fa-edit' aria-hidden='true'></span></button>";
    html += "<a href='#' role='button' class='btn btn-primary hide' data-whatever='"+imgUrl+"' data-toggle='modal' data-target='#addNewAdImg'><span class='fa fa-fw fa-edit' aria-hidden='true'></span></a>"
    html += "</div>";
    html += "<div class='col-sm-8'><div class='form-group'>";
    html += "<label class='col-sm-4 control-label'>图片链接</label>";
    html += "<div class='col-sm-8'><p class='form-control-static'>"+link+"("+target+")"+"</p></div>";
    html += "<label class='col-sm-4 control-label'>图片宽高</label>";
    html += "<div class='col-sm-8'><p class='form-control-static'>"+scale+"</p></div>";
    html += "<label class='col-sm-4 control-label'>图片详情</label>";
    html += "<div class='col-sm-8'><p class='form-control-static'>"+details+"</p></div>";
    html += "</div></div>";
    html += "<div class='clearfix'></div>";
    html += "</div>";

    return html;
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
                    showErrorInfo(data);
                }
        });
    }
    else{
        alert("参数校验不通过");
    }
}

//主要针对删除操作
function angularHttpGet($http,url,callBack){
    $http.get(url).success(function(result){
        $('.modal').each(function(i){
            $(this).modal("hide");
        });
        if(result == 'success'){
            callBack(result);
        }else{
            showErrorInfo(result);
        }
    })
}


function showErrorInfo(info){
    $('#error-info').removeClass('hide').css('opacity',1).html("<i class='icon fa fa-warning'></i>&nbsp"+info);
    setTimeout(function () {
        $('#error-info').animate({
            'opacity': 0
        }, 1000, function () {
            $('#error-info').addClass('hide');
        });
    }, 5000);
}

//提示用户操作窗口
function initCheckIfDo($scope,targetId,msg,callBack){
    $('#checkIfDo').on('show.bs.modal', function (event) {
        if(targetId){
            $scope.targetID = targetId;
        }
        $(this).find('.modal-msg').text(msg);
    }).on('hide.bs.modal', function (event) {
        $scope.targetID ="";
    });
    $('#checkIfDo').modal('show');
    //确认执行删除
    $scope.confirmDo = function (currentID) {
        callBack(currentID);
    };
}


//初始化删除操作
function initDelOption($scope,$http,currentPage,searchKey,info){
//    单条记录删除
    $scope.delOneItem = function(id){
        initCheckIfDo($scope,id,info,function(currentID){
            angularHttpGet($http,"/admin/manage/"+currentPage+"/del?uid="+currentID,function(){
                initPagination($scope,$http,currentPage,searchKey);
            });
        });
    };

    $scope.getNewIds = function(){
        getSelectIds();
    };

//    批量删除
    $scope.batchDel = function(){
        var targetIds = $('#targetIds').val();
        if(targetIds && targetIds.split(',').length > 0){
            initCheckIfDo($scope,$('#targetIds').val(),info,function(currentID){
                angularHttpGet($http,"/admin/manage/"+currentPage+"/batchDel?ids="+currentID,function(){
                    initPagination($scope,$http,currentPage,searchKey);
                });
            });
        }else{
            alert('请至少选择一项')
        }
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
        //'width': 80,
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

//普通下拉菜单
function iniNormalTree($http,treeObjId,url,listId,currentId,onClick){

    $http.get(url).success(function(result){

        if(currentId){
            if(url.indexOf('contentTemps') >0 ){
                $("#"+listId).html(getCateNameByAlias(result,currentId));
            }else{
                $("#"+listId).html(getCateNameById(result,currentId));
            }
        }
        var arrTree = changeToTreeJson(result);
        var setting = {
            view: {
                dblClickExpand: false,
                selectedMulti: false
            },
            data: {
                simpleData: {
                    enable: true
                }
            },
            callback: {
                beforeClick: beforeClick,
                onClick: onClick
            }
        };

        function beforeClick(treeId, treeNode) {
            var check = (treeNode && !treeNode.isParent);
            if (!check) alert("不能选择顶级分类");
            return check;
        }

        $.fn.zTree.init($("#"+treeObjId), setting, arrTree);
    })
}

//权限管理数据初始化
function setAdminPowerTreeData(){
    return [
        { id:'sysTemManage', pId:0, name:"系统管理", open:true},
        { id:'sysTemManage_user', pId:'sysTemManage', name:"系统用户管理", open:true},
        { id:'sysTemManage_user_add', pId:'sysTemManage_user', name:"新增"},
        { id:'sysTemManage_user_view', pId:'sysTemManage_user', name:"查看"},
        { id:'sysTemManage_user_modify', pId:'sysTemManage_user', name:"修改"},
        { id:'sysTemManage_user_del', pId:'sysTemManage_user', name:"删除"},

        { id:'sysTemManage_uGroup', pId:'sysTemManage', name:"系统用户组管理", open:true},
        { id:'sysTemManage_uGroup_add', pId:'sysTemManage_uGroup', name:"新增"},
        { id:'sysTemManage_uGroup_view', pId:'sysTemManage_uGroup', name:"查看"},
        { id:'sysTemManage_uGroup_modify', pId:'sysTemManage_uGroup', name:"修改"},
        { id:'sysTemManage_uGroup_del', pId:'sysTemManage_uGroup', name:"删除"},

        { id:'sysTemManage_ads', pId:'sysTemManage', name:"广告管理", open:true},
        { id:'sysTemManage_ads_add', pId:'sysTemManage_ads', name:"新增"},
        { id:'sysTemManage_ads_view', pId:'sysTemManage_ads', name:"查看"},
        { id:'sysTemManage_ads_modify', pId:'sysTemManage_ads', name:"修改"},
        { id:'sysTemManage_ads_del', pId:'sysTemManage_ads', name:"删除"},

        { id:'sysTemManage_files', pId:'sysTemManage', name:"文件管理", open:true},
        { id:'sysTemManage_files_view', pId:'sysTemManage_files', name:"查看"},
        { id:'sysTemManage_files_modify', pId:'sysTemManage_files', name:"修改"},
        { id:'sysTemManage_files_del', pId:'sysTemManage_files', name:"删除"},

        { id:'sysTemManage_data', pId:'sysTemManage', name:"数据管理", open:true},
        { id:'sysTemManage_data_1', pId:'sysTemManage_data', name:"数据备份", open:true},
        { id:'sysTemManage_data_1_view', pId:'sysTemManage_data_1', name:"查看"},
        { id:'sysTemManage_data_1_backup', pId:'sysTemManage_data_1', name:"执行备份"},
        { id:'sysTemManage_data_1_del', pId:'sysTemManage_data_1', name:"删除"},

        { id:'sysTemManage_logs', pId:'sysTemManage', name:"系统日志管理", open:true},
        { id:'sysTemManage_logs_view', pId:'sysTemManage_logs', name:"查看"},
        { id:'sysTemManage_logs_del', pId:'sysTemManage_logs', name:"删除"},

        { id:'contentManage', pId:0, name:"内容管理", open:true},
        { id:'contentManage_content', pId:'contentManage', name:"文档管理", open:true},
        { id:'contentManage_content_add', pId:'contentManage_content', name:"新增"},
        { id:'contentManage_content_view', pId:'contentManage_content', name:"查看"},
        { id:'contentManage_content_top', pId:'contentManage_content', name:"置顶"},
        { id:'contentManage_content_modify', pId:'contentManage_content', name:"修改"},
        { id:'contentManage_content_del', pId:'contentManage_content', name:"删除"},

        { id:'contentManage_cateGory', pId:'contentManage', name:"文档类别管理", open:true},
        { id:'contentManage_cateGory_add', pId:'contentManage_cateGory', name:"新增"},
        { id:'contentManage_cateGory_view', pId:'contentManage_cateGory', name:"查看"},
        { id:'contentManage_cateGory_modify', pId:'contentManage_cateGory', name:"修改"},
        { id:'contentManage_cateGory_del', pId:'contentManage_cateGory', name:"删除"},

        { id:'contentManage_tag', pId:'contentManage', name:"文档标签管理", open:true},
        { id:'contentManage_tag_add', pId:'contentManage_tag', name:"新增"},
        { id:'contentManage_tag_view', pId:'contentManage_tag', name:"查看"},
        { id:'contentManage_tag_modify', pId:'contentManage_tag', name:"修改"},
        { id:'contentManage_tag_del', pId:'contentManage_tag', name:"删除"},

        { id:'contentManage_temp', pId:'contentManage', name:"文档模板管理", open:true},
        { id:'contentManage_temp_add', pId:'contentManage_temp', name:"新增"},
        { id:'contentManage_temp_view', pId:'contentManage_temp', name:"查看"},
        { id:'contentManage_temp_modify', pId:'contentManage_temp', name:"修改"},
        { id:'contentManage_temp_del', pId:'contentManage_temp', name:"删除"},

        { id:'contentManage_msg', pId:'contentManage', name:"留言管理", open:true},
        { id:'contentManage_msg_view', pId:'contentManage_msg', name:"查看"},
        { id:'contentManage_msg_add', pId:'contentManage_msg', name:"回复"},
        { id:'contentManage_msg_del', pId:'contentManage_msg', name:"删除"},

        { id:'userManage', pId:0, name:"会员管理", open:true},
        { id:'userManage_user', pId:'userManage', name:"注册用户管理", open:true},
        { id:'userManage_user_view', pId:'userManage_user', name:"查看"},
        { id:'userManage_user_modify', pId:'userManage_user', name:"修改"},
        { id:'userManage_user_del', pId:'userManage_user', name:"删除"}

    ]
}


