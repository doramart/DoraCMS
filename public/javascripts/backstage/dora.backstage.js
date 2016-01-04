$(function(){
    //全局初始化
   $(':checkbox').prop('checked',false);
   $('#targetIds').val('');

});


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



//将后台获取的list解析为tree对象所需的json数据
function changeToTreeJson(result,key,oldValue){
    var arrTree = [];
    var treeItem;
    for(var i=0;i<result.length;i++){
        if(key === "tags"){
            var checkState = false;
            var tagsArr = oldValue.split(",");
            for(var j=0;j<tagsArr.length;j++){
                if(result[i].name === tagsArr[j].toString()){
                    checkState = true;
                    break;
                }
            }
            treeItem = new TagsTree(result[i]._id,result[i].name,checkState);

        }else if(key === "tempTree"){
            treeItem = new TempsTree(result[i]._id,result[i].name,result[i].forder);
        }else if(key === "tempForderTree"){
            treeItem = new TempsTree(0,result[i].name,"");
        }else if(key === "allThemeFolderTree"){
            treeItem = new TempsTree(result[i]._id,result[i].name,result[i].alias);
        }else{
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


//初始化普通列表分页
function initPagination($scope,$http){
    initPageInfo($scope);
    getPageInfos($scope,$http,"/admin/manage/getDocumentList/"+$('#currentCate').val(),'normalList');
}


//初始化模板商店接口分页
function initApiPagination($scope,$http){
    initPageInfo($scope);
    getPageInfos($scope,$http,"http://api.html-js.cn/system/template",'themeShop');
}

function initPageInfo($scope){
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
    $scope.keywords = $('#searchInput').val();
    $scope.area = $('#pageArea').val();
}


//翻页组件
function getPageInfos($scope,$http,url,reqType){

    // 定义翻页动作
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

    $scope.firstPage = function () {
        if ($scope.currentPage > 1) {
            $scope.currentPage = 1;
            getPageInfos($scope,$http,url);
        }
    };

    $scope.lastPage = function () {
        if ($scope.currentPage < $scope.totalPage) {
            $scope.currentPage = $scope.totalPage;
            getPageInfos($scope,$http,url);
        }
    };

    $scope.changeOption = function(){
        $scope.limit = Number($scope.limitNum);
        getPageInfos($scope,$http,url);
    };

    $http.get(url+"?limit="+$scope.limit+"&currentPage="+$scope.currentPage+"&searchKey="+$scope.keywords+"&area="+$scope.area).success(function(result){
        console.log("getData success!");
        if(reqType == 'normalList'){
            $scope.data = result.docs;
        }else if(reqType == 'themeShop'){
            $scope.themeShop = result.docs;
        }else{
            $scope.data = result.docs;
        }
        if(result.pageInfo){
            $scope.totalItems = result.pageInfo.totalItems;
            $scope.currentPage = result.pageInfo.currentPage;
            $scope.limit = result.pageInfo.limit;
            $scope.startNum = result.pageInfo.startNum;
            //获取总页数
            $scope.totalPage = Math.ceil($scope.totalItems / $scope.limit);

            var pageArr = [];
            var page_start = $scope.currentPage - 2 > 0 ? $scope.currentPage - 2 : 1;
            var page_end = page_start + 4 >= $scope.totalPage ? $scope.totalPage : page_start + 4;
            for(var i=page_start;i<=page_end;i++){
                pageArr.push(i);
            }
            $scope.pages = pageArr;

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


//主要针对删除操作
function angularHttpGet($http,url,callBack){
    $http.get(url).success(function(result){
        $('.modal').each(function(i){
            $(this).modal("hide");
        });
        if(result == 'success'){
            callBack(result);
        }else{
            $.tipsShow({ message : result, type : 'warning' });
        }
    })
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
function initDelOption($scope,$http,info){

    // 单条记录删除
    $scope.delOneItem = function(id){
        initCheckIfDo($scope,id,info,function(currentID){
            angularHttpGet($http,"/admin/manage/"+$('#currentCate').val()+"/del?uid="+currentID,function(){
                initPagination($scope,$http);
            });
        });
    };

    $scope.getNewIds = function(){
        getSelectIds();
    };

    // 批量删除
    $scope.batchDel = function(){
        var targetIds = $('#targetIds').val();
        if(targetIds && targetIds.split(',').length > 0){
            initCheckIfDo($scope,$('#targetIds').val(),info,function(currentID){
                angularHttpGet($http,"/admin/manage/"+$('#currentCate').val()+"/batchDel?ids="+currentID+"&expandIds="+$('#expandIds').val(),function(){
                    initPagination($scope,$http);
                });
            });
        }else{
            alert('请至少选择一项')
        }
    }

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
        { id:'contentManage_temp_1', pId:'contentManage_temp', name:"模板配置", open:true},
        { id:'contentManage_temp_1_add', pId:'contentManage_temp_1', name:"模板安装"},
        { id:'contentManage_temp_1_import', pId:'contentManage_temp_1', name:"安装本地模板"},
        { id:'contentManage_temp_1_view', pId:'contentManage_temp_1', name:"查看"},
        { id:'contentManage_temp_1_modify', pId:'contentManage_temp_1', name:"模板启动"},
        { id:'contentManage_temp_1_del', pId:'contentManage_temp_1', name:"模板卸载"},
        { id:'contentManage_tpItem_add', pId:'contentManage_temp_1', name:"添加模板单元"},
        { id:'contentManage_tpItem_del', pId:'contentManage_temp_1', name:"删除模板单元"},

        { id:'contentManage_temp_2', pId:'contentManage_temp', name:"模板编辑", open:true},
        { id:'contentManage_temp_2_view', pId:'contentManage_temp_2', name:"查看"},
        { id:'contentManage_temp_2_modify', pId:'contentManage_temp_2', name:"修改"},

        { id:'contentManage_msg', pId:'contentManage', name:"留言管理", open:true},
        { id:'contentManage_msg_view', pId:'contentManage_msg', name:"查看"},
        { id:'contentManage_msg_add', pId:'contentManage_msg', name:"回复"},
        { id:'contentManage_msg_del', pId:'contentManage_msg', name:"删除"},

        { id:'contentManage_notice', pId:'contentManage', name:"消息管理", open:true},
        { id:'contentManage_notice_1', pId:'contentManage_notice', name:"公告管理", open:true},
        { id:'contentManage_notice_1_add', pId:'contentManage_notice_1', name:"新增"},
        { id:'contentManage_notice_1_view', pId:'contentManage_notice_1', name:"查看"},
        { id:'contentManage_notice_1_modify', pId:'contentManage_notice_1', name:"修改"},
        { id:'contentManage_notice_1_del', pId:'contentManage_notice_1', name:"删除"},

        { id:'contentManage_notice_2', pId:'contentManage_notice', name:"用户消息", open:true},
        { id:'contentManage_notice_2_view', pId:'contentManage_notice_2', name:"查看"},
        { id:'contentManage_notice_2_del', pId:'contentManage_notice_2', name:"删除"},

        { id:'contentManage_notice_3', pId:'contentManage_notice', name:"系统消息", open:true},
        { id:'contentManage_notice_3_view', pId:'contentManage_notice_3', name:"查看"},
        { id:'contentManage_notice_3_modify', pId:'contentManage_notice_3', name:"标记已读"},
        { id:'contentManage_notice_3_del', pId:'contentManage_notice_3', name:"删除"},

        { id:'userManage', pId:0, name:"会员管理", open:true},
        { id:'userManage_user', pId:'userManage', name:"注册用户管理", open:true},
        { id:'userManage_user_view', pId:'userManage_user', name:"查看"},
        { id:'userManage_user_modify', pId:'userManage_user', name:"修改"},
        { id:'userManage_user_del', pId:'userManage_user', name:"删除"}

    ]
}


//获取添加或修改链接
function getTargetPostUrl($scope,bigCategory){
    var url = "/admin/manage/"+bigCategory+"/addOne";
    if($scope.targetID){
        url = "/admin/manage/"+bigCategory+"/modify?uid="+$scope.targetID;
    }
    return url;
}

//普通下拉菜单
/*
 treeObjId 放置树的容器ID
 url 请求树的数据接口
 listId 显示当前选中项的容器ID
 currentId 需要回选的对象ID
 */
function initTreeDataByType($scope,$http,type){

    var params = getTreeParams($scope,type);
    $http.get(params.url).success(function(result){
        //回选指定值
        if(type == 'allThemeFolderTree'){
            params.currentId = result[0]._id;
        }
        if(params.currentId){
            $("#"+params.listId).html(getCateNameById(result,params.currentId));
        }
        var arrTree = changeToTreeJson(result,params.treeObjId);
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
                onClick: afterClick
            }
        };
        function beforeClick(treeId, treeNode) {
            var check = (treeNode && !treeNode.isParent);
            if (!check) alert("不能选择顶级分类");
            return check;
        }
        function afterClick(e, treeId, treeNode){
            var zTree = $.fn.zTree.getZTreeObj(params.treeObjId),
                nodes = zTree.getSelectedNodes(),
                v = "",
                vid = "",
                sortPath = "",
                alias = "";

            nodes.sort(function compare(a,b){return a.id-b.id;});
            for (var i=0, l=nodes.length; i<l; i++) {
                v += nodes[i].name ;
                vid += nodes[i].id ;
                sortPath += nodes[i].sortPath ;
                alias += nodes[i].alias ;
            }
            if(type == "adminGroup"){
                $scope.formData.group = vid;
            }else if(type == "contentCategories"){
                $scope.formData.category = vid;
                $scope.formData.sortPath = sortPath;
                // 针对顶级类别的文章做标记
                if(sortPath.split(',').length == 2){
                    $scope.formData.type = "singer";
                }else if(sortPath.split(',').length == 3){
                    $scope.formData.type = "content";
                }
            }else if(type == "tempForderTree"){
                $scope.formData.forder = v;
            }else if(type == "tempTree"){
                $scope.formData.contentTemp = vid;
            }else if(type == "allThemeFolderTree"){
                $scope.formData.targetTemp = alias ;
                initSystemTempData($scope,$http)
            }

            $('#'+params.listId).html(v);
        }

        $.fn.zTree.init($("#"+params.treeObjId), setting, arrTree);
    })
}

/*根据不同树类型获取建立树所需参数
* adminGroupTree 管理员组
* contentCategories 文档分类树
* tempForderTree 本地模板文件夹树
* tempTree 数据表中可用模板树
* */
function getTreeParams($scope,type){
    var currentCate = '';
    var treeParams = {};
    var treeObjId = '';
    var url = '';
    var listId = '';
    var defaultForder = '';
    if(type == 'adminGroup'){
        if($scope.formData && $scope.formData.group){
            currentCate = $scope.formData.group._id;
        }
        treeObjId = 'adminGroupTree';
        url = "/admin/manage/adminGroupList/list";
        listId = 'groupName';
    }else if(type == 'contentCategories'){
        if($scope.formData){
            currentCate = $scope.formData.category;
        }
        treeObjId = 'cateTree';
        url = "/admin/manage/contentCategorys/list";
        listId = 'categoryName';
    }else if(type == 'tempForderTree'){ // 模板文件夹树
        if($scope.formData){
            currentCate = $scope.formData.forder;
            defaultForder = $scope.formData.defaultTemp;
        }
        treeObjId = 'tempForderTree';
        url = "/admin/manage/contentTemps/folderList?defaultTemp="+defaultForder;
        listId = 'tempForderName';
    }else if(type == 'tempTree'){ // 可用模板树
        if($scope.formData){
            currentCate = $scope.formData.contentTemp;
        }
        treeObjId = 'tempTree';
        url = "/admin/manage/contentTemps/list";
        listId = 'tempsName';
    }else if(type == "allThemeFolderTree"){ // 当前站点下安装的所有主题
        treeObjId = 'allThemeFolderTree';
        url = "/admin/manage/contentTemps/tempFolderList";
        listId = 'themeName';
    }

    return {
        treeObjId : treeObjId,
        url : url,
        listId : listId,
        currentId : currentCate
    }
}

//初始化文档标签tags
function initContentTags($scope,$http){
    $http.get("/admin/manage/contentTags/list").success(function(result){
        var oldTags = $scope.formData.tags;
        if(!oldTags){
            oldTags = "0";
        }
        var tagsTree = changeToTreeJson(result,"tags",oldTags);
        var setting = {
            check: {
                enable: true,
                chkboxType: {"Y":"", "N":""}
            },
            view: {
                dblClickExpand: false
            },
            data: {
                simpleData: {
                    enable: true
                }
            },
            callback: {
                beforeClick: beforeTagsClick,
                onCheck: onTagsCheck
            }
        };
        var zNodes = tagsTree;
        $.fn.zTree.init($("#tagsTree"), setting, zNodes);

        function beforeTagsClick(treeId, treeNode) {
            var zTree = $.fn.zTree.getZTreeObj("tagsTree");
            zTree.checkNode(treeNode, !treeNode.checked, null, true);
            return false;
        }

        function onTagsCheck(e, treeId, treeNode) {
            var zTree = $.fn.zTree.getZTreeObj("tagsTree"),
                nodes = zTree.getCheckedNodes(true),
                v = "";
            for (var i=0, l=nodes.length; i<l; i++) {
                if(i > 3){
                    return;
                }
                v += nodes[i].name + ",";
            }
            if (v.length > 0 ) {
                v = v.substring(0, v.length-1);
            }
            var tagObj = $("#tagSel");
            tagObj.val("");
            tagObj.val(v);
            tagObj.attr("value", v);
            $scope.formData.tags = v;
        }
    })
}

function showTagsMenu() {
    var cityObj = $("#tagSel");
    var cityOffset = $("#tagSel").offset();
    $("#menuContent").slideDown("fast");

    $("body").bind("mousedown", onBodyDown);
}
function hideTagsMenu() {
    $("#menuContent").fadeOut("fast");
    $("body").unbind("mousedown", onBodyDown);
}
function onBodyDown(event) {
    if (!(event.target.id == "menuBtn" || event.target.id == "tagSel" || event.target.id == "menuContent" || $(event.target).parents("#menuContent").length>0)) {
        hideTagsMenu();
    }
}


//文档模板管理
function showMessage($scope,$http,result,msg){
    if(result == 'success'){
        $.tipsShow({
            message : msg ,
            type : 'success',
            callBack : function(){
                initPagination($scope,$http);
            }
        });
    }else{
        $.tipsShow({ message : result, type : 'warning' });
    }
}

//初始化管理员权限列表
function initPowerList($scope){

    var setting = {
        view: {
            selectedMulti: false
        },
        check: {
            enable: true
        },
        data: {
            simpleData: {
                enable: true
            }
        },
        callback: {
            beforeCheck: beforeCheck,
            onCheck: onCheck
        }
    };

    var zNodes = setAdminPowerTreeData();
    var code, log, className = "dark";
    function beforeCheck(treeId, treeNode) {
        className = (className === "dark" ? "":"dark");
        return (treeNode.doCheck !== false);
    }
    function onCheck(e, treeId, treeNode) {
        var zTree = $.fn.zTree.getZTreeObj("groupPowerTree"),
            checkedNodes = zTree.getCheckedNodes(true);
        var nodesArr = [];
        for(var i=0;i<checkedNodes.length;i++){
            var currentNode = checkedNodes[i];
            nodesArr.push(currentNode.id + ':' + true);
        }
        $scope.formData.power = nodesArr;
    }
    $.fn.zTree.init($("#groupPowerTree"), setting, zNodes);
}


//文档类别管理
function getCategoryData($scope,$http){
    $http.get("/admin/manage/contentCategorys/list").success(function(result){

        var arrTree = changeToTreeJson(result);
        //  ztree 相关参数设置
        var IDMark_A = "_a";
        var setting = {
            view: {
                addDiyDom: addDiyDom
            },
            data: {
                simpleData: {
                    enable: true
                }
            }
        };

        function addDiyDom(treeId, treeNode) {
            if (treeNode.parentNode && treeNode.parentNode.id != 2) return;
            var aObj = $("#" + treeNode.tId + IDMark_A);
            var editStr = "";
            editStr += "&nbsp;<span id='diyBtn_" +treeNode.id+ "'><a href='#' data-whatever='editNc_" +treeNode.id+ "' class='text-primary' role='button' data-toggle='modal' data-target='#addContentCategory'>编辑</a></span>";
            editStr += "&nbsp;<span id='diyBtn_" +treeNode.id+ "'><a href='#' data-whatever='" +treeNode.id+ "' class='text-primary' role='button' data-toggle='modal' data-target='#checkIfDel'>删除</a></span>";
            editStr += "&nbsp;<span id='diyBtn_" +treeNode.id+ "'><a href='#' data-contenttemp='" +treeNode.contentTemp+ "' data-homepage='" +treeNode.homePage+ "' data-array='" +treeNode.sortPath+ "' data-whatever='addSub_" +treeNode.id+ "' class='text-primary' role='button' data-toggle='modal' data-target='#addContentCategory'>添加子类</a></span>";
            aObj.after(editStr);
        }

        $.fn.zTree.init($("#categoryTree"), setting, arrTree);

    })
}

// 判断需要删除的节点是否被选中或者是否有子节点
function checkIfParent(){
    var treeObj = $.fn.zTree.getZTreeObj("categoryTree");
    var sNodes = treeObj.getSelectedNodes();
    if (sNodes.length > 0) {
        var isParent = sNodes[0].isParent;
        if(isParent){
            return true;
        }
        else{
            return false;
        }
    }else{
        return true;
    }
}


//系统模板树
function initSystemTempData($scope,$http){
    var targetTemp;
    if($scope.formData){
        targetTemp = $scope.formData.targetTemp;
    }
    $http.get("/admin/manage/contentTemps/tempListByFolder?targetTemp="+targetTemp).success(function(result){

        var arrTree = result;
        var initTreeData = result[0];
        if(initTreeData){
            $http.get("/admin/manage/contentTemps/getFileInfo?filePath="+initTreeData.path).success(function(result){
                $scope.formData.code = result.fileData;
                $scope.formData.name = initTreeData.name;
                $scope.formData.path = initTreeData.path;
            })
        }
        //  ztree 相关参数设置
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
                onClick: afterClick
            }
        };

        function beforeClick(treeId, treeNode) {
            var check = (treeNode && !treeNode.isParent);
            if (!check) alert("不能选择顶级分类");
            return check;
        }

        function afterClick(e, treeId, treeNode){
            var zTree = $.fn.zTree.getZTreeObj('sysTemTempTree'),
                nodes = zTree.getSelectedNodes(),
                v = "",
                vid = "",
                filePath = "";

            nodes.sort(function compare(a,b){return a.id-b.id;});
            for (var i=0, l=nodes.length; i<l; i++) {
                v += nodes[i].name ;
                vid += nodes[i].id ;
                filePath += nodes[i].path ;

            }

            if(filePath){
                $http.get("/admin/manage/contentTemps/getFileInfo?filePath="+filePath).success(function(result){
                    $scope.formData.code = result.fileData;
                    $scope.formData.name = v;
                    $scope.formData.path = filePath;
                })
            }

        }

        $.fn.zTree.init($("#sysTemTempTree"), setting, arrTree);

    })
}

//系统公告模块设为已读
function setNoticesRead(ids){
    var idsObj = ids.split(',');
    if(idsObj.length>0){
        for(var i=0;i<idsObj.length;i++){
            var targetId = idsObj[i];
            $('#'+targetId).removeClass('noRead');
        }
    }
}

//关闭模态窗口初始化数据
function clearModalData($scope,modalObj){
    $scope.formData = {};
    $scope.targetID = "";
    modalObj.find(".form-control").val("");
}

//文件管理器
function getFolderList($scope,$http,path){
    $("#dataLoading").removeClass("hide");
    $http.get("/admin/manage/filesList/list?filePath="+path).success(function(result){
        $scope.fileData = result.pathsInfo;
        $scope.rootPath = result.rootPath;
        $scope.currentPath =  getCurrentPath($scope,path);
        $("#dataLoading").addClass("hide");

    })
}

// 获取当前文件目录
function getCurrentPath($scope,path){
    if(path){
        var cutLength = ($scope.rootPath).length;
        var currentPath  = path.substring(cutLength,path.length);
        return currentPath;
    }else{
        return "";
    }
}

//广告模块 初始化关闭按钮监听
function initCloseBtn($scope,contentArray){
    $('#imgInfolist > .alert').on('closed.bs.alert', function () {
        // 删除数组中的元素同时删除绑定数据
        for(var m=0;m<contentArray.length;m++){
            if(JSON.parse(contentArray[m]).sImg === $(this).find("img").attr("src")){
                contentArray.splice(m,1);
                $scope.formData.content = contentArray.join();
            }
        }
    })
}