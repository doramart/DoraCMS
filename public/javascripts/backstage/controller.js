/**
 * Created by Administrator on 2015/12/9.
 * doraCMS自定义控制器
 */
var doraApp = angular.module('adminApp',[]);

doraApp.factory('pageData',function(){
    return {
        bigCategory : $("#currentCate").val()
    }
});

doraApp.factory('getItemService',['$http',function($http){
    //获取单个对象信息
    var getItemRequest = function(currentPage,targetId){
        var requestPath = "/admin/manage/"+currentPage+"/item?uid="+targetId;
        return $http.get(requestPath)
    };
    return {
        itemInfo : function(currentPage,targetId){
            return getItemRequest(currentPage,targetId);
        }
    }
}]);



//管理主界面
doraApp.controller("mainPanel",['$scope','$http',function($scope,$http){

    $http.get("/admin/manage/getMainInfo").success(function(result){
        $scope.mainData = result;
    });

}]);


//文档列表
doraApp.controller('contentList',['$scope','$http',function($scope,$http){
    $scope.formData = {};
    //获取文档列表信息
    initPagination($scope,$http);
    //删除文档
    initDelOption($scope,$http,'您确认要删除选中的文档吗？');
    // 文章推荐
    $scope.topContent = function(id,m){
        angularHttpGet($http,"/admin/manage/ContentList/topContent?uid="+id+"&isTop="+m,function(){
            initPagination($scope,$http);
        });
    };
}]);

//管理员用户列表
doraApp.controller("adminUserList",['$scope','$http','pageData','getItemService',function($scope,$http,pageData,getItemService){

    $scope.formData = {};
    //获取管理员列表信息
    initPagination($scope,$http);
    //删除用户
    initDelOption($scope,$http,'您确认要删除选中的管理员吗？');
    //logo上传
    initUploadFyBtn('uploadULogoImg','images',"userlogo",function(data){
        $.tipsShow({
            message : '上传成功',
            type : 'success' ,
            callBack : function(){
                $("#userLogo").attr("src",data);
                $scope.formData.logo = data;
            }
        });

    });
    // 修改用户
    $('#addNewAdminUser').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editId = obj.data('whatever');
        // 如果不为空则为编辑状态
        if(editId){
            getItemService.itemInfo(pageData.bigCategory,editId).success(function(result){
                $scope.formData = result;
                $scope.targetID = editId;
                initTreeDataByType($scope,$http,'adminGroup');
            })
        }else{
            $scope.formData = {};
            initTreeDataByType($scope,$http,'adminGroup');
        }

    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        clearModalData($scope,$(this));
    });

    //添加新用户或修改用户
    $scope.processForm = function(isValid){
        if(!$scope.formData.group){
            $.tipsShow({
                message : '请选择用户组',
                type : 'warning' ,
                callBack : function(){
                    return;
                }
            });
        }else{
            angularHttpPost($http,isValid,getTargetPostUrl($scope,pageData.bigCategory),$scope.formData,function(data){
                initPagination($scope,$http);
            });
        }

    };

}]);


//管理员用户组列表
doraApp.controller("adminGroup",['$scope','$http','pageData','getItemService',function($scope,$http,pageData,getItemService){
    $scope.formData = {};
    $scope.formData.power = {};
    $scope.checkInfo = {};
    //获取管理员用户组列表
    initPagination($scope,$http);
    //初始化管理栏目列表
    initPowerList($scope);
    //删除用户
    initDelOption($scope,$http,'您确认要删除选中的用户组吗？');

    // 修改用户
    $('#addAdminGroup').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editId = obj.data('whatever');
        var modalTitle = $(this).find('.modal-title');
        // 如果不为空则为编辑状态
        if(editId){
            modalTitle.text("编辑用户组");
            getItemService.itemInfo(pageData.bigCategory,editId).success(function(result){
                $scope.formData.name = result.name;
                if(result.power){
                    $scope.formData.power = JSON.parse(result.power);
                    // 回选checkbox
                    var powerTreeObj = eval(result.power);
                    for(var i=0;i<powerTreeObj.length;i++){
                        var checkedId = powerTreeObj[i].split(':')[0];
                        var treeObj = $.fn.zTree.getZTreeObj("groupPowerTree");
                        var node = treeObj.getNodeByParam("id", checkedId, null);
                        if(node){
                            node.checked = true;
                            treeObj.updateNode(node);
                        }
                    }
                }
                $scope.targetID = editId;
            })
        }else{
            modalTitle.text("添加新用户组");
            cancelTreeCheckBoxSelect("groupPowerTree");
            $scope.formData = {};
        }
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        cancelTreeCheckBoxSelect("groupPowerTree");
        clearModalData($scope,$(this));
    });

    // 添加新用户组
    $scope.processForm = function(isValid){
        var groupData = {
            name : $scope.formData.name,
            power : JSON.stringify($scope.formData.power)
        };
        angularHttpPost($http,isValid,getTargetPostUrl($scope,pageData.bigCategory),groupData,function(data){
            initPagination($scope,$http);
        });
    }
}]);


//广告列表
doraApp.controller("adsList",['$scope','$http',function($scope,$http){
    $scope.formData = {};
    //获取邮件模板列表信息
    initPagination($scope,$http);
    // 删除广告
    initDelOption($scope,$http,'您确认要删除选中的广告吗？');

}]);


//广告编辑/添加
doraApp.controller("addTxtAds",['$scope','$http','pageData','getItemService',function($scope,$http,pageData,getItemService){
    $scope.formData = {};
    //广告类型初始化
    $scope.selectAdsType = [
        {name:'0',value : '默认广告'},
        {name:'2',value : '友情链接'}
    ];
    $scope.formData.type = '0';
    $scope.formData.state = '1';

    $scope.targetID = window.location.href.split("/")[7];
    if($scope.targetID){
        getItemService.itemInfo(pageData.bigCategory,$scope.targetID).success(function(result){
            $scope.formData = result;
            $scope.formData.title = result.items[0].title;
            $scope.formData.link = result.items[0].link;
        })
    }

    // 添加或修改广告
    $scope.processForm = function(isValid){
        var url = "/admin/manage/"+pageData.bigCategory+"/addOne";
        if($scope.targetID){
            url = "/admin/manage/"+pageData.bigCategory+"/modifyTxtAds?uid="+$scope.targetID;
        }
        angularHttpPost($http,isValid,url,$scope.formData,function(data){
            window.location = "/admin/manage/adsList";
        });
    }
}]);


doraApp.controller("addImgAdsInfo",['$scope','$http','pageData','getItemService',function($scope,$http,pageData,getItemService){
    $scope.formData = {};
    $scope.itemsFormData = {};
    $scope.formData.type = '1';

    // 初始化上传按钮
    initUploadFyBtn('uploadAdsImg','images','',function(data){
        $("#myImg").attr("src",data);
        $scope.itemsFormData.sImg = data;
    });

    //初始化选择菜单
    $scope.selectTarget = [
        {name:'_blank',value : '_blank'},
        {name:'_self',value : '_self'}
    ];
    $scope.itemsFormData.target = '_blank';

    $scope.targetID = window.location.href.split("/")[7];
    if($scope.targetID){
        initAdsInfos($scope);
    }

    //修改图片广告主体信息
    $('#addMainAds').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editId = obj.data('whatever');
        if(editId){
            getItemService.itemInfo(pageData.bigCategory,editId).success(function(result){
                $scope.formData = result;
            })
        }
    }).on('hidden.bs.modal', function (e) {
        $(this).find(".form-control").val("");
    });

    // 添加图片信息窗口
    $('#addNewAdImg').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editId = obj.data('whatever');
        if(editId){
            $http.get("/admin/manage/adsItems/findItem?uid="+editId).success(function(result){
                $scope.itemsFormData = result;
                $("#myImg").attr("src",result.sImg);
            });
        }
    }).on('hidden.bs.modal', function (e) {
        $scope.itemsFormData = {};
        $(this).find(".form-control").val("");
        $("#myImg").attr("src","");
    });

    // 添加或修改广告
    $scope.processMainAds = function(isValid){
        angularHttpPost($http,isValid,getTargetPostUrl($scope,pageData.bigCategory),$scope.formData,function(data){
            initAdsInfos($scope);
        });
    };

    //添加图片信息
    $scope.processImgForm = function(isValid){
        var url = "/admin/manage/adsItems/addItem?adsId="+$scope.targetID;
        if($scope.itemsFormData._id){
            url = "/admin/manage/adsItems/modifyItem?adsId="+$scope.targetID+"&uid="+$scope.itemsFormData._id;
        }
        angularHttpPost($http,isValid,url,$scope.itemsFormData,function(data){
            initAdsInfos($scope);
        });
    };

    //删除单个图片
    $scope.delAdsItem = function(id){
        initCheckIfDo($scope,$scope.targetID,'确定删除该图片么？',function(){
            angularHttpGet($http,"/admin/manage/adsItems/delItem?adsId="+$scope.targetID+"&uid="+id,function(){
                initAdsInfos($scope);
            });
        });

    };
    //刷新数据
    function initAdsInfos($scope){
        $('.modal').each(function(i){$(this).modal("hide");});
        $scope.targetID = window.location.href.split("/")[7];
        getItemService.itemInfo(pageData.bigCategory,$scope.targetID).success(function(result){
            $scope.formData = result;
            $scope.itemsList = result.items;
        })
    }
}]);


//文件管理器
doraApp.controller("filesList",['$scope','$http',function($scope,$http){
    $scope.formData = {};
    $scope.mdFormData = {};
    $scope.fileData = {};

    // 初始化显示方式
    $scope.listView = true;
    getFolderList($scope,$http,"");

    // 监听确认删除弹窗，传递参数
    $scope.delFilesItem = function(filePath){
        initCheckIfDo($scope,'','您确认要删除该文件吗？',function(path){
            angularHttpGet($http,"/admin/manage/filesList/fileDel?filePath="+filePath,function(){
                getFolderList($scope,$http,$scope.currentPath);
            });
        });
    };

    // 重命名弹窗参数传递
    $('#reNameFile').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editPath = obj.data('whatever');
        // 如果不为空则为编辑状态
        if(editPath){
            $scope.formData.oldName = (editPath.split(","))[0];
            $scope.formData.path = (editPath.split(","))[1];
            $scope.targetID = (editPath.split(","))[1];
        }else{

        }
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        clearModalData($scope,$(this));
    });

    // 修改html代码参数传递
    $('#modifyFile').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editPath = obj.data('whatever');
        // 如果不为空则为编辑状态
        if(editPath){
            $scope.mdFormData.name = (editPath.split(","))[0];
            $scope.mdFormData.path = (editPath.split(","))[1];
            $scope.targetID = (editPath.split(","))[1];
            $http.get("/admin/manage/filesList/getFileInfo?filePath="+$scope.mdFormData.path).success(function(result){
                $scope.mdFormData.code = result.fileData;
            })
        }else{

        }
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        $scope.mdFormData = {};
        clearModalData($scope,$(this));
    });

    $scope.processForm = function(isValid){
        var curentUrl = "/admin/manage/filesList/addFolder";
        if($scope.targetID)
        {
            $scope.formData.newPath = $scope.currentPath +"/"+ $scope.formData.newName;
            curentUrl = "/admin/manage/filesList/fileReName";
        }
        angularHttpPost($http,isValid,curentUrl,$scope.formData,function(data){
            getFolderList($scope,$http,$scope.currentPath);
        });
    };

    // 提交更新后的文件
    $scope.processMdForm = function(isValid){

        angularHttpPost($http,isValid,'/admin/manage/filesList/updateFileInfo',$scope.mdFormData,function(data){
            getFolderList($scope,$http,$scope.currentPath);
        });

    };

    $scope.newFolder  = function(){
        alert("开发中...")
    };
    // 列表或缩略图切换
    $scope.listViewShow = function(){
        $scope.listView = true;
    };

    $scope.thumbnailViewShow = function(){
        $scope.listView = false;
    };

    // 进入点击的目录
    $scope.getFiles = function(type,name,path){
        if(type === "folder"){
            // 记录前一路径
            getFolderList($scope,$http,path);
        }else if(type === "image" && $scope.listView){

        }
    };

    $scope.getAllFiles = function(){
        getFolderList($scope,$http,"")
    };

    // 进入上级目录
    $scope.getPrePath = function(){
        // 找到上级目录
        var currentPathArr = ($scope.currentPath).split("/");
        if(currentPathArr.length > 0){
            var currentFolderLength = (currentPathArr[currentPathArr.length-1]).length + 1;
            var prePath = ($scope.currentPath).substring(0,($scope.currentPath).length - currentFolderLength);
            $scope.prePath = prePath;
        }
        getFolderList($scope,$http,$scope.prePath);
    }

}]);

//数据管理
doraApp.controller("backUpData",['$scope','$http',function($scope,$http){
    //初始化名称和权限
    $scope.formData = {};
    //获取备份数据列表
    initPagination($scope,$http);
    //删除备份数据
    $scope.delDataItem = function(id,path){
        initCheckIfDo($scope,id,'您确认要删除该条备份数据吗？',function(currentID){
            angularHttpGet($http,"/admin/manage/backupDataManage/delItem?uid="+currentID+"&filePath="+path,function(){
                initPagination($scope,$http);
            });
        });
    };

    $scope.backUpData = function(){
        initCheckIfDo($scope,'','确认执行备份操作？数据库操作请谨慎处理',function(currentID){
            angularHttpGet($http,"/admin/manage/backupDataManage/backUp",function(){
                $.tipsShow({
                    message : '数据备份成功',
                    type : 'success' ,
                    callBack : function(){
                        initPagination($scope,$http);
                    }
                });
            });
        });
    };
}]);


//系统日志
doraApp.controller("systemLogs",['$scope','$http',function($scope,$http){
    // 初始化名称和权限
    $scope.formData = {};
    //获取日志数据列表
    initPagination($scope,$http);
    //删除日志数据
    initDelOption($scope,$http,'确定删除选定的日志吗？');

}]);


//文档新增/编辑
doraApp.controller("addContent",['$scope','$http','pageData','getItemService',function($scope,$http,pageData,getItemService){
    $scope.formData = {};
    $scope.tagFormData = {};
    // 初始化文章分类
    initTreeDataByType($scope,$http,"contentCategories");
    // 初始化文章标签
    initContentTags($scope,$http);
    // 初始化上传按钮
    initUploadFyBtn('uploadContentImg','images',"ctTopImg",function(data){
        $.tipsShow({
            message : '上传成功',
            type : 'success' ,
            callBack : function(){
                $("#myImg").attr("src",data);
                $scope.formData.sImg = data;
            }
        });

    });
    // 通过访问地址获取文章id
    $scope.targetID = window.location.href.split("/")[8];
    if($scope.targetID){
        getItemService.itemInfo(pageData.bigCategory,$scope.targetID).success(function(result){
            $scope.formData = result;
            initTreeDataByType($scope,$http,"contentCategories");
            initContentTags($scope,$http);
            $("#myImg").attr("src",$scope.formData.sImg)
        })
    }
    // 添加或修改文章
    $scope.processForm = function(isValid){
        $scope.formData.state = true;
        if(!$scope.formData.category){
            $.tipsShow({
                message : '请选择文档类别',
                type : 'warning' ,
                callBack : function(){
                    return;
                }
            });
        }else{
            angularHttpPost($http,isValid,getTargetPostUrl($scope,pageData.bigCategory),$scope.formData,function(data){
                window.location = "/admin/manage/contentList";
            });
        }

    };
    //  存草稿
    $scope.saveAsDraft = function(){
        $scope.formData.state = false;
        var errors;
        if(!$scope.formData.title){
            errors = '文档标题必须填写';
        }
        if(!$scope.formData.category){
            errors = '文档类别必须选择';
        }
        if(errors){
            $.tipsShow({
                message : errors,
                type : 'warning' ,
                callBack : function(){
                    return;
                }
            });
        }else{
            angularHttpPost($http,true,getTargetPostUrl($scope,pageData.bigCategory),$scope.formData,function(data){
                window.location = "/admin/manage/contentList";
            });
        }

    };

    $scope.getContentState = function(){
        if(!$scope.formData.state && $scope.targetID){
            return true;
        }else if($scope.targetID == undefined){
            return true;
        }else{
            return false;
        }
    };

    // 新增标签
    $('#addContentTags').on('show.bs.modal', function (event) {
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        $scope.tagFormData = {};
    });

    // 添加新标签
    $scope.addNewTagForm = function(isValid){
        angularHttpPost($http,isValid,getTargetPostUrl($scope,'contentManage_tag'),$scope.tagFormData,function(data){
            initContentTags($scope,$http);
        });
    }
}]);

//插件新增/编辑
doraApp.controller("addPlugs",['$scope','$http','pageData','getItemService',function($scope,$http,pageData,getItemService){
    $scope.formData = {};
    // 初始化插件分类
    initTreeDataByType($scope,$http,"contentCategories");
    // 初始化上传按钮
    initUploadFyBtn('uploadPlugImg','images','plugTopImg',function(data){
        $.tipsShow({
            message : '上传成功',
            type : 'success' ,
            callBack : function(){
                $("#myImg").attr("src",data);
                $scope.formData.sImg = data;
            }
        });
    });
    // 通过访问地址获取插件id
    $scope.targetID = window.location.href.split("/")[8];
    if($scope.targetID){
        getItemService.itemInfo(pageData.bigCategory,$scope.targetID).success(function(result){
            $scope.formData = result;
            initTreeDataByType($scope,$http,"contentCategories");
            $("#myImg").attr("src",$scope.formData.sImg)
        })
    }
    // 添加或修改插件
    $scope.processForm = function(isValid){
        $scope.formData.type = "plug";
        if(!$scope.formData.category){
            $.tipsShow({
                message : '请选择插件类',
                type : 'warning' ,
                callBack : function(){
                    return;
                }
            });
        }else{
            angularHttpPost($http,isValid,getTargetPostUrl($scope,pageData.bigCategory),$scope.formData,function(data){
                window.location = "/admin/manage/contentList";
            });
        }
    }
}]);


//类别管理
doraApp.controller('contentCategorys',['$scope','$http','pageData','getItemService', function ($scope,$http,pageData,getItemService) {
    // 初始化系统模板树
    initTreeDataByType($scope,$http,"tempTree");
    // 数据初始化
    $scope.warningInfo = {};
    $scope.formData = {};
    $scope.formData.parentID = "0";

    getCategoryData($scope,$http);
    //删除用户
    $('#checkIfDel').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        $scope.targetID = obj.data('whatever');
    }).on('hide.bs.modal', function (event) {
        $scope.targetID ="";
    });
    //确认执行删除
    $scope.delCategoryItem = function () {

        if(checkIfParent()){
            $('#checkIfDel').modal("hide");
            $scope.warningInfo.title = "警告";
            $scope.warningInfo.message = "失败！没有选中节点或该节点下有子节点！";
            $('#askifdo').modal("show");
        }else{
            var currentID =  $scope.targetID;
            angularHttpGet($http,"/admin/manage/"+pageData.bigCategory+"/del?uid="+currentID,function(){
                getCategoryData($scope,$http);
            });
        }
    };

    // 修改类别
    $('#addContentCategory').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editId = obj.data('whatever');
        var sortPath = obj.data('array');
        // 继承父类的文件路径
        var homePage = obj.data('homepage');
        //  继承父类内容模板
        var contentTemp = obj.data('contenttemp');
        var modalTitle = $(this).find('.modal-title');
        //  如果不为空则为编辑状态
        if(editId){
            // 子类不用设置模板，继承父类大类模板
            $("#setCateTemp").addClass("hide");
            $("#defaultUrl").addClass("hide");

            var opt = editId.substring(0,6);
            var currentID = editId.substring(7,editId.length);
            // 判断是编辑还是添加子类
            if(opt === "addSub"){
                $("#defaultUrl").removeClass("hide");
                modalTitle.text("添加子类");
                $scope.formData.parentID = currentID;
                $scope.formData.sortPath = sortPath;
                $scope.formData.defaultUrl = homePage;
                $scope.formData.contentTemp = contentTemp;
                $scope.targetID = "";
            }
            else if(opt === "editNc"){
                modalTitle.text("编辑分类");
                getItemService.itemInfo(pageData.bigCategory,currentID).success(function(result){
                    $scope.formData = result;
                    $scope.targetID = currentID;
                    // 针对顶级分类可以修改模板
                    if(result.sortPath.split(',').length == 2){
                        initTreeDataByType($scope,$http,"tempTree");
                        $("#setCateTemp").removeClass("hide");
                    }
                })
            }
        }else{
            $("#setCateTemp").removeClass("hide");
            $("#defaultUrl").removeClass("hide");

            modalTitle.text("添加文档类别");
            $scope.formData = {};
            $scope.formData.parentID = "0";
            $scope.formData.sortPath = "0";
        }
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        clearModalData($scope,$(this));
    });

    //添加类别
    $scope.processForm = function(isValid){

        angularHttpPost($http,isValid,getTargetPostUrl($scope,pageData.bigCategory),$scope.formData,function(data){
            getCategoryData($scope,$http);
        });

    }

}]);

//文档标签
doraApp.controller("contentTags",['$scope','$http','pageData','getItemService',function($scope,$http,pageData,getItemService){
    //初始化名称和权限
    $scope.formData = {};
    //获取标签列表
    initPagination($scope,$http);
    //删除标签
    initDelOption($scope,$http,'您确认要删除选中的标签吗？');

    // 修改标签
    $('#addContentTags').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editId = obj.data('whatever');
        var modalTitle = $(this).find('.modal-title');
        // 如果不为空则为编辑状态
        if(editId){
            modalTitle.text("编辑文章标签");
            getItemService.itemInfo(pageData.bigCategory,editId).success(function(result){
                $scope.formData = result;
                $scope.targetID = editId;
            })
        }else{
            modalTitle.text("添加新标签");
            $scope.formData = {};
        }
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        clearModalData($scope,$(this));
    });

    // 添加新标签
    $scope.processForm = function(isValid){
        angularHttpPost($http,isValid,getTargetPostUrl($scope,pageData.bigCategory),$scope.formData,function(data){
            initPagination($scope,$http);
        });
    }
}]);


//模板列表
doraApp.controller("contentTemps",['$scope','$http','pageData','getItemService',function($scope,$http,pageData,getItemService){

    // 初始化名称和权限
    $scope.formData = {};
    // 获取模板列表
    initPagination($scope,$http);
    // 删除模板单元
    $scope.delTempItem = function(id){
        initCheckIfDo($scope,id,'您确认要删除选中的模板单元吗？',function(currentID){
            angularHttpGet($http,"/admin/manage/contentManage_tpItem/del?uid="+currentID,function(){
                initPagination($scope,$http);
            });
        });
    };

    // 修改模板
    $('#addContentTemps').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editId = obj.data('whatever');
        var defaultTemp = obj.data('defaulttemp');
        var modalTitle = $(this).find('.modal-title');
        // 如果不为空则为编辑状态
        if(editId){
            modalTitle.text("编辑文章模板");
            getItemService.itemInfo(pageData.bigCategory,editId).success(function(result){
                $scope.formData = result;
                $scope.targetID = editId;
                initTreeDataByType($scope,$http,"tempForderTree")
            })
        }else{
            modalTitle.text("添加模板单元");
            $scope.formData = {};
            $scope.formData.defaultTemp = defaultTemp;
            initTreeDataByType($scope,$http,"tempForderTree")
        }
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        clearModalData($scope,$(this));
    });

    // 添加新模板单元
    $scope.processForm = function(isValid){

        angularHttpPost($http,isValid,"/admin/manage/templateItem/addNew?defaultTemp="+$scope.formData.defaultTemp,$scope.formData,function(data){
            initPagination($scope,$http);
        });

    };

    // 启用模板
    $scope.enableThisTemp = function(tempId,alias){

        $http.get('/admin/manage/enableTemp?tempId='+tempId+'&alias='+alias).success(function(result){
            showMessage($scope,$http,result,'恭喜，您已成功启用该模板！');
        })
    };
    // 卸载模板初始化
    initDelOption($scope,$http,'该操作无法撤销，确认要执行吗？');

}]);

//系统模板管理
doraApp.controller("systemTemps",['$scope','$http',function($scope,$http){
    // 初始化系统模板
    initApiPagination($scope,$http);
    //初始化上传模板按钮
    initUploadFyBtn('uploadCmsTemp','zip',"cmsTemp",function(data){
        if(data.indexOf('success') >= 0){
            var tempId = data.split('&')[1];
            $.block({
                message : $('#sys-progress-bar'),
                mask : true
            });
            $http.get('/admin/manage/chekcIfUnzipSuccess?tempId='+tempId).success(function(result){
                if(result && result === 'has'){
                    $http.get('/admin/manage/initTempData?tempId='+tempId).success(function(result){
                        $.unblock();
                        showMessage($scope,$http,result,'恭喜，您已成功上传该模板！');
                        window.location.reload();
                    })
                }else if(result && result === 'imperfect'){
                    $.unblock();
                    $.tipsShow({ message : '压缩包内文件不完整', type : 'warning' });
                }else if(result && result === 'nopower'){
                    $.unblock();
                    $.tipsShow({ message : '对不起，您无权执行该操作！', type : 'warning' });
                }
            })

        }else{
            $.tipsShow({ message : data, type : 'warning' });
        }
    });
    // 安装模板
    $scope.installTheme = function(tempId){
        $.block({
            message : $('#sys-progress-bar'),
            mask : true
        });
        $http.get('/admin/manage/installTemp?tempId='+tempId).success(function(result){
            setTimeout(function(){
                $.unblock();
                showMessage($scope,$http,result,'恭喜，您已成功安装该模板！');
                window.location.reload();
            },8000)
        })

    };
}]);

//模板编辑
doraApp.controller("contentTempEdit",['$scope','$http',function($scope,$http){
    $scope.formData = {};
    initTreeDataByType($scope,$http,"allThemeFolderTree");
    initSystemTempData($scope,$http);

    // 提交更新后的文件
    $scope.processMdForm = function(isValid){
        angularHttpPost($http,isValid,'/admin/manage/contentTemps/updateFileInfo',$scope.formData,function(data){
            $.tipsShow({ message : '更新成功！', type : 'success' });
        });
    };

}]);


//留言管理
doraApp.controller("messageList",['$scope','$http','pageData','getItemService',function($scope,$http,pageData,getItemService){
    // 初始化名称和权限
    $scope.formData = {};
    $scope.repFormData = {};
    //获取留言列表
    initPagination($scope,$http);
    //删除留言
    $scope.delMsgsItem = function(id){
        initCheckIfDo($scope,id,'您确认要删除该条留言吗？',function(currentID){
            angularHttpGet($http,"/admin/manage/"+pageData.bigCategory+"/del?uid="+currentID,function(){
                initPagination($scope,$http);
            });
        });
    };

    // 查看留言详情
    $('#getMsgDetails').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var msgObj = obj.data('whatever');

        $('#showMsgDetail').html(msgObj.content);
        $scope.repFormData.relationMsgId = msgObj._id;
        $scope.repFormData.contentId = msgObj.contentId;
        $scope.repFormData.contentTitle = msgObj.contentTitle;
        $scope.repFormData.utype = '1';

        if(msgObj.author){
            $scope.repFormData.replyId = msgObj.author._id;
            $scope.repFormData.replyEmail = msgObj.author.email;
        }

    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        $('#showMsgDetail').html("");
        clearModalData($scope,$(this));
    });

    // 留言回复
    $scope.repMsgForm = function(isValid){
        angularHttpPost($http,isValid,'/admin/manage/'+pageData.bigCategory+'/addOne',$scope.repFormData,function(data){
            initPagination($scope,$http);
        });
    }

}]);

//公告管理
doraApp.controller("contentnotices",['$scope','$http',function($scope,$http){
    // 初始化名称和权限
    $scope.formData = {};
    //获取公告列表
    initPagination($scope,$http);
    //删除公告
    initDelOption($scope,$http,'您确认要删除选中的公告吗？');

}]);

//添加新公告
doraApp.controller("addNotice",['$scope','$http','pageData','getItemService',function($scope,$http,pageData,getItemService){
    $scope.formData = {};
    // 通过访问地址获取文章id
    $scope.targetID = window.location.href.split("/")[7];
    if($scope.targetID){
        getItemService.itemInfo(pageData.bigCategory,$scope.targetID).success(function(result){
            $scope.formData = result;
        })
    }
    // 添加新公告
    $scope.processForm = function(isValid){
        angularHttpPost($http,isValid,getTargetPostUrl($scope,pageData.bigCategory),$scope.formData,function(data){
            window.location = "/admin/manage/systemNotice";
        });
    }
}]);


//系统通知
doraApp.controller("contentnotices",['$scope','$http',function($scope,$http){
    // 初始化名称和权限
    $scope.formData = {};
    //获取公告列表
    initPagination($scope,$http);
    //删除公告
    initDelOption($scope,$http,'您确认要删除选中的消息吗？');
    //设为已读
    $scope.batchIsRead = function(){
        var targetIds = $('#targetIds').val();
        if(targetIds && targetIds.split(',').length > 0){
            angularHttpGet($http,"/admin/userNotify/setHasRead?msgId="+targetIds,function(){
                setNoticesRead(targetIds);
            });
        }else{
            $.tipsShow({ message : '请至少选择一项', type : 'warning' });
        }
    };
}]);

//会员管理
doraApp.controller("regUsersList",['$scope','$http','pageData','getItemService',function($scope,$http,pageData,getItemService){
    $scope.formData = {};
    //获取注册用户列表信息
    initPagination($scope,$http);
    //删除用户
    initDelOption($scope,$http,'您确认要删除选中的会员吗？');
    // 修改用户
    $('#addNewRegUser').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editId = obj.data('whatever');
        // 如果不为空则为编辑状态
        if(editId){
            getItemService.itemInfo(pageData.bigCategory,editId).success(function(result){
                $scope.formData = result;
                $scope.targetID = editId;
            })
        }else{
            $scope.formData = {};
        }
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        clearModalData($scope,$(this));
    });

    // 添加新用户或修改用户
    $scope.processForm = function(isValid){
        angularHttpPost($http,isValid,getTargetPostUrl($scope,pageData.bigCategory),$scope.formData,function(data){
            initPagination($scope,$http);
        });
    };

}]);

//用户通知
doraApp.controller("usernotices",['$scope','$http',function($scope,$http){
    // 初始化名称和权限
    $scope.formData = {};
    //获取公告列表
    initPagination($scope,$http);
    //删除公告
    initDelOption($scope,$http,'您确认要删除选中的消息吗？');

}]);