var express = require('express');
var router = express.Router();
router.caseSensitive = true;
var url = require('url');

//管理员对象
var AdminUser = require("../models/AdminUser");
//管理员用户组对象
var AdminGroup = require("../models/AdminGroup");
// 文档对象
var Content = require("../models/Content");
//数据操作日志
var DataOptionLog = require("../models/DataOptionLog");
//文章类别对象
var ContentCategory = require("../models/ContentCategory");
//文章标签对象
var ContentTags = require("../models/ContentTags");
//文章模板对象
var ContentTemplate = require("../models/ContentTemplate");
var TemplateItems = require("../models/TemplateItems");
//文章留言对象
var Message = require("../models/Message");
//注册用户对象
var User = require("../models/User");
//广告对象
var Ads = require("../models/Ads");
var AdsItems = require("../models/AdsItems");
//数据校验
var validator = require('validator');
//短id
var shortid = require('shortid');
//系统操作
var system = require("../util/system");
//系统缓存
var cache = require("../util/cache");
//站点配置
var settings = require("../models/db/settings");
var adminFunc = require("../models/db/adminFunc");
//加密类
var crypto = require("crypto");
//数据库操作对象
var DbOpt = require("../models/Dbopt");
//系统日志对象
var SystemOptionLog = require("../models/SystemOptionLog");
//消息对象
var Notify = require("../models/Notify");
var UserNotify = require("../models/UserNotify");
//文件操作
var unzip = require('unzip');
var fs = require('fs');
var iconv = require('iconv-lite');
var http = require('http');
var request = require('request');
/* GET home page. */

var PW = require('png-word');
var RW = require('../util/randomWord');
var rw = RW('abcdefghijklmnopqrstuvwxyz1234567890');
var pngword = new PW(PW.GRAY);



//管理员登录页面
router.get('/', function(req, res) {
    req.session.vnum = rw.random(4);
    res.render('manage/adminLogin',{ title: settings.SITETITLE , description : 'DoraCMS后台管理登录'});
});

//刷新验证码
router.get('/vnum',function(req, res){
    var word = req.session.vnum;
    pngword.createPNG(word,function(word){
        res.end(word);
    })
});


// 管理员登录提交请求
router.post('/doLogin', function(req, res) {
    var userName = req.body.userName;
    var password = req.body.password;
    var vnum = req.body.vnum;
    var newPsd = DbOpt.encrypt(password,settings.encrypt_key);

    if(vnum != req.session.vnum){
        req.session.vnum = rw.random(4);
        res.end('验证码有误！');
    }else{
        if(validator.isUserName(userName) && validator.isPsd(password)){

            AdminUser.findOne({'userName':userName,'password':newPsd}).populate('group').exec(function(err,user){
                if(err){
                    res.end(err);
                }
                if(user) {
                    req.session.adminPower = user.group.power;
                    req.session.adminlogined = true;
                    req.session.adminUserInfo = user;
                    //获取管理员通知信息
                    adminFunc.getAdminNotices(req,res,function(noticeObj){
                        req.session.adminNotices = noticeObj;
                        // 存入操作日志
                        SystemOptionLog.addUserLoginLogs(req,res,adminFunc.getClienIp(req));
                        res.end("success");
                    });
                }else{
                    console.log("登录失败");
                    res.end("用户名或密码错误");
                }
            });

        }else{
            res.end(settings.system_illegal_param)
        }
    }

});

// 管理员退出
router.get('/logout', function(req, res) {
    req.session.adminlogined = false;
    req.session.adminPower = '';
    req.session.adminUserInfo = '';
    res.redirect("/admin");
});

//-------------------------后台模块访问入口开始----------------------------

//管理主界面
router.get('/manage', function(req, res) {
    res.render('manage/main', adminFunc.setPageInfo(req,res,settings.SYSTEMMANAGE));
});

//获取系统首页数据集合
router.get('/manage/getMainInfo', function(req, res) {
    adminFunc.setMainInfos(req, res);
});

//系统用户管理（list）
router.get('/manage/adminUsersList', function(req, res) {
    res.render('manage/adminUsersList', adminFunc.setPageInfo(req,res,settings.adminUsersList));
});
//系统用户组管理（list）
router.get('/manage/adminGroupList', function(req, res) {
    res.render('manage/adminGroupList', adminFunc.setPageInfo(req,res,settings.adminGroupList));
});

//广告管理（list）
router.get('/manage/adsList', function(req, res) {
    res.render('manage/adsList', adminFunc.setPageInfo(req,res,settings.adsList));
});

//文件管理界面（list）
router.get('/manage/filesList', function(req, res) {
    res.render('manage/filesList', adminFunc.setPageInfo(req,res,settings.filesList));
});

//数据备份
router.get('/manage/backUpData', function(req, res) {
    res.render('manage/backUpData', adminFunc.setPageInfo(req,res,settings.backUpData));
});

router.get('/manage/systemLogs', function(req, res) {
    res.render('manage/systemLogs', adminFunc.setPageInfo(req,res,settings.systemLogs));
});

//文档列表页面
router.get('/manage/contentList', function(req, res) {
    res.render('manage/contentList', adminFunc.setPageInfo(req,res,settings.contentList));
});

//文档类别列表页面
router.get('/manage/contentCategorys', function(req, res) {
    res.render('manage/contentCategorys', adminFunc.setPageInfo(req,res,settings.contentCategorys));
});

//文档标签管理（list）
router.get('/manage/contentTags', function(req, res) {
    res.render('manage/contentTags', adminFunc.setPageInfo(req,res,settings.contentTags));
});

//模板配置
router.get('/manage/contentTemps', function(req, res) {
    res.render('manage/contentTemps', adminFunc.setPageInfo(req,res,settings.contentTemps));
});

//模板编辑
router.get('/manage/contentTempsEdit', function(req, res) {
    res.render('manage/contentTempsEdit', adminFunc.setPageInfo(req,res,settings.contentTempsEdit));
});

//文档留言管理（list）
router.get('/manage/messageList', function(req, res) {
    res.render('manage/messageList', adminFunc.setPageInfo(req,res,settings.messageList));
});

//注册用户管理（list）
router.get('/manage/regUsersList', function(req, res) {
    res.render('manage/regUsersList', adminFunc.setPageInfo(req,res,settings.regUsersList));
});

//管理员公告列表页面
router.get('/manage/systemNotice', function(req, res) {
    req.query.area = 'announce';
    res.render('manage/adminNotice', adminFunc.setPageInfo(req,res,settings.systemNotice));

});

//用户消息管理列表
router.get('/manage/userNotice', function(req, res) {
    res.render('manage/userNotice', adminFunc.setPageInfo(req,res,settings.userNotice));
});

//系统消息列表
router.get('/manage/sysTemBackStageNotice', function(req, res) {
    req.query.area = 'systemNotice';
    adminFunc.renderToManagePage(req, res,'manage/systemNotice',settings.sysTemBackStageNotice);

});

//-------------------------后台模块访问入口结束----------------------------


//-------------------------对象列表查询开始(带分页)-------------------------------

router.get('/manage/getDocumentList/:defaultUrl',function(req,res){

    var targetObj = adminFunc.getTargetObj(req.params.defaultUrl);
    var params = url.parse(req.url,true);
    var keywords = params.query.searchKey;
    var area = params.query.area;
    var keyPr = [];
    //携带可能的查询条件
    if(keywords){
        var reKey = new RegExp(keywords, 'i');
        if(targetObj == Content){
            keyPr.push({'comments' : { $regex: reKey } });
            keyPr.push({'title' : { $regex: reKey } });
        }else if(targetObj == AdminUser){
            keyPr = {'userName' : { $regex: reKey} };
        }else if(targetObj == User){
            keyPr.push({'userName' : { $regex: reKey } });
            keyPr.push({'name' : { $regex: reKey } });
        }else if(targetObj == ContentTags){
            keyPr.push({'alias' : { $regex: reKey } });
            keyPr.push({'name' : { $regex: reKey } });
        }else if(targetObj == Ads){
            keyPr.push({'name' : { $regex: reKey } });
        }
    }
    keyPr = adminFunc.setQueryByArea(req,keyPr,targetObj,area);
    DbOpt.pagination(targetObj,req, res,keyPr);

});


//-------------------------对象列表查询结束(带分页)-------------------------------


//-------------------------对象删除开始-------------------------

router.get('/manage/:defaultUrl/del',function(req,res){
    var currentPage = req.params.defaultUrl;
    var params = url.parse(req.url,true);
    var targetObj = adminFunc.getTargetObj(currentPage);

    if(targetObj == Message){
        removeMessage(req,res)
    }else if(targetObj == Notify){
        adminFunc.delNotifiesById(req,res,params.query.uid,function(){
            res.end("success");
        });
    }else if(targetObj == UserNotify){
        //管理员删除系统消息
        if(currentPage == settings.sysTemBackStageNotice[0]){

        }
    }else if(targetObj == AdminGroup){
        if(params.query.uid == req.session.adminUserInfo.group._id){
            res.end('当前用户拥有的权限信息不能删除！');
        }else{
            DbOpt.del(targetObj,req,res,"del one obj success");
        }
    }else if(targetObj == AdminUser){
        if(params.query.uid == req.session.adminUserInfo._id){
            res.end('不能删除当前登录的管理员！');
        }else{
            Message.find({'adminAuthor' : params.query.uid},function(err,docs){
                if(err){
                    res.end(err)
                }
                if(docs && docs.length>0){
                    res.end('请清理您的评论后再删除该用户！');
                }else{
                    DbOpt.del(targetObj,req,res,"del one obj success");
                }
            });
        }
    }else if(targetObj == ContentTemplate){
        removeTemplate(req,res);
    }else if(targetObj == Ads){
        removeAds(req,res);
    }else if(targetObj == TemplateItems){
        removeTemplateItem(req,res);
    }else{
        DbOpt.del(targetObj,req,res,"del one obj success");
    }

});

//批量删除对象
router.get('/manage/:defaultUrl/batchDel',function(req,res){
    var currentPage = req.params.defaultUrl;
    var params = url.parse(req.url,true);
    var targetObj = adminFunc.getTargetObj(currentPage);
    var ids = params.query.ids;
    var idsArr = ids.split(',');
    if(targetObj == Message || targetObj == AdminGroup || targetObj == AdminUser || targetObj == Notify){
        res.end(settings.system_batch_delete_not_allowed);
    }else if(targetObj == UserNotify){
        //管理员删除系统消息
        if(currentPage == settings.sysTemBackStageNotice[0]){
            var nids = params.query.expandIds;
            var nidsArr = nids.split(',');
            if(nidsArr.length > 0){
                for(var i=0;i<nidsArr.length;i++){
                    adminFunc.delNotifiesById(req,res,nidsArr[i]);
                }
                //更新消息数
                adminFunc.getAdminNotices(req,res,function(noticeObj){
                    req.session.adminNotices = noticeObj;
                    res.end('success');
                });
            }
        }
    }else{
        targetObj.remove({'_id':{$in: idsArr}},function(err){
            if(err){
                res.end(err);
            }else{
                res.end("success");
            }
        });

    }

});

//-------------------------对象删除结束-------------------------



//-------------------------获取单个对象数据开始-------------------------
router.get('/manage/:defaultUrl/item',function(req,res){
    var currentPage = req.params.defaultUrl;
    var targetObj = adminFunc.getTargetObj(currentPage);
    var params = url.parse(req.url,true);
    var targetId = params.query.uid;

    if(targetObj == AdminUser){
        AdminUser.getOneItem(res,targetId,function(user){
            return res.json(user);
        });
    }else if(targetObj == Ads){
        Ads.getOneAds(res,targetId,function(doc){
            return res.json(doc);
        });
    }else{
        DbOpt.findOne(targetObj,req, res,"find one obj success");
    }

});

//-------------------------获取单个对象数据结束-------------------------



//-------------------------更新单条记录(执行更新)开始--------------------
router.post('/manage/:defaultUrl/modify',function(req,res){
    var currentPage = req.params.defaultUrl;
    var targetObj = adminFunc.getTargetObj(currentPage);
    var params = url.parse(req.url,true);

    if(targetObj == AdminUser || targetObj == User){
        req.body.password = DbOpt.encrypt(req.body.password,settings.encrypt_key);
    }else if(targetObj == AdminGroup){
        if(params.query.uid == req.session.adminUserInfo.group._id){
            req.session.adminPower = req.body.power;
        }
    }else if(targetObj == ContentCategory){
        ContentCategory.updateCategoryTemps(req,res,params.query.uid);
    }
    DbOpt.updateOneByID(targetObj,req, res,"update one obj success")

});


//-------------------------更新单条记录(执行更新)结束--------------------



//-------------------------对象新增开始-------------------------
router.post('/manage/:defaultUrl/addOne',function(req,res){

    var currentPage = req.params.defaultUrl;
    var targetObj = adminFunc.getTargetObj(currentPage);

    if(targetObj == AdminUser){
        addOneAdminUser(req,res);
    }else if(targetObj == ContentCategory){
        addOneCategory(req,res)
    }else if(targetObj == Content){
        req.body.author = req.session.adminUserInfo._id;
        DbOpt.addOne(targetObj,req, res);
    }else if(targetObj == ContentTags){
        addOneContentTags(req,res)
    }else if(targetObj == ContentTemplate){
        addOneContentTemps(req,res)
    }else if(targetObj == Ads){
        addOneAds(req,res)
    }else if(targetObj == Message){
        replyMessage(req,res);
    }else if(targetObj == Notify){
        addOneNotice(req,res);
    }else{
        DbOpt.addOne(targetObj,req, res);
    }


});

//-------------------------对象新增结束-------------------------


//----------------获取指定对象列表数据(不分页)开始-----------------

//系统管理员用户组列表
router.get('/manage/adminGroupList/list', function(req, res) {
    DbOpt.findAll(AdminGroup,req, res,"request adminGroupList")
});

//文件夹列表查询
router.get('/manage/filesList/list', function(req, res) {
    var params = url.parse(req.url,true);
    var path = params.query.filePath;
    //避免伪造路径
    if(path.indexOf('../') >= 0){
        res.json({});
    }else{
        var filePath = system.scanFolder(settings.UPDATEFOLDER,path);
        //    对返回结果做初步排序
        filePath.sort(function(a,b){return a.type == "folder" ||  b.type == "folder"});
        return res.json({
            pathsInfo : filePath
        });
    }
});

//文章类别列表
router.get('/manage/contentCategorys/list', function(req, res) {
    return res.json(ContentCategory.find({}).sort({'sortId': 1}));
});

//所有标签列表
router.get('/manage/contentTags/list', function(req, res) {
    DbOpt.findAll(ContentTags,req, res,"request ContentTags List")
});

//所有默认模板列表
router.get('/manage/contentTemps/list', function(req, res) {
    ContentTemplate.getDefaultTemp(res,function(doc){
        if(doc){
            return res.json(doc.items);
        }else{
            return res.json({});
        }
    });
});

//----------------获取指定对象列表数据(不分页)结束-----------------





//删除留言
function removeMessage(req,res){
    var params = url.parse(req.url,true);
    var targetId = params.query.uid;

    Message.findOne({_id : targetId},'contentId',function(err,result){
        if(err){
            res.end(err);
        }else{
            if(result && result.contentId){
                var contentId = result.contentId;
                Content.findOne({_id : contentId},function(err,contentObj){
                    if(err){
                        res.end(err);
                    }else{
                        Message.remove({_id : params.query.uid},function(err){
                            if(contentObj && contentObj.commentNum && contentObj.commentNum > 0){
                                contentObj.commentNum = contentObj.commentNum -1 ;
                                contentObj.save(function(err){
                                    if(err){
                                        res.end(err);
                                    }else{
                                        res.end("success");
                                    }
                                });
                            }else{
                                res.end("success");
                            }
                        });
                    }
                });
            }
        }
    });

}




//添加系统用户
function addOneAdminUser(req,res){
    var errors;
    var userName = req.body.userName;
    if(validator.isUserName(userName)){
        AdminUser.findOne({userName:req.body.userName},function(err,user){
            if(user){
                errors = "该用户名已存在！";
                res.end(errors);
            }else{
                if(!req.body.group){
                    errors = "请选择用户组！";
                }
                if(errors){
                    res.end(errors)
                }else{
                    // 密码加密
                    req.body.password = DbOpt.encrypt(req.body.password,settings.encrypt_key);
                    req.body.group = new AdminGroup({_id : req.body.group});
                    DbOpt.addOne(AdminUser,req, res);
                }
            }
        })
    }else{
        res.end(settings.system_illegal_param)
    }

}


//------------------------------------------系统用户管理结束



//------------------------------------------文件管理器开始

//文件删除
router.get('/manage/filesList/fileDel', function(req, res) {
    var params = url.parse(req.url,true);
    var path = settings.UPDATEFOLDER + params.query.filePath;
    if(adminFunc.checkAdminPower(req,settings.filesList[0] + '_del')){
        if(path){
            system.deleteFolder(req, res, path,function(){
                res.end('success');
            });
        }else{
            res.end(settings.system_noPower);
        }
    }else{
        res.end(settings.system_noPower);
    }

});

//文件重命名
router.post('/manage/filesList/fileReName', function(req, res) {
    var newPath = settings.UPDATEFOLDER + req.body.newPath;
    var path = settings.UPDATEFOLDER + req.body.path;
    if(adminFunc.checkAdminPower(req,settings.filesList[0] + '_modify')){
        if(path && newPath){
            system.reNameFile(req,res,path,newPath);
        }else{
            res.end(settings.system_noPower);
        }
    }else{
        res.end(settings.system_noPower);
    }

});

//修改文件内容读取文件信息
router.get('/manage/filesList/getFileInfo', function(req, res) {

    if(adminFunc.checkAdminPower(req,settings.filesList[0] + '_view')){
        var params = url.parse(req.url,true);
        var path = settings.UPDATEFOLDER + params.query.filePath;
        if((params.query.filePath).indexOf('../') >= 0){
            res.end(settings.system_noPower);
        }
        if(path){
            system.readFile(req,res,path);
        }else{
            res.end(settings.system_noPower);
        }
    }else{
        return res.json({
            fileData : {}
        })
    }
});

//修改文件内容更新文件信息
router.post('/manage/filesList/updateFileInfo', function(req, res) {

    var fileContent = req.body.code;
    var path = settings.UPDATEFOLDER + req.body.path;
    if(adminFunc.checkAdminPower(req,settings.filesList[0] + '_modify')){
        if(path){
            system.writeFile(req,res,path,fileContent);
        }else{
            res.end(settings.system_noPower);
        }
    }else{
        res.end(settings.system_noPower);
    }
});

//------------------------------------------文件管理器结束


//------------------------------------------数据管理开始
//备份数据库执行
router.get('/manage/backupDataManage/backUp', function(req, res) {
    if(adminFunc.checkAdminPower(req,settings.backUpData[0] + '_backup')) {
        system.backUpData(res, req);
    }else{
        res.end(settings.system_noPower);
    }
});


//备份数据记录删除
router.get('/manage/backupDataManage/delItem', function(req, res) {

    var params = url.parse(req.url,true);
    var forderPath = params.query.filePath;
    var targetId = params.query.uid;
    if(shortid.isValid(targetId)){
        if(adminFunc.checkAdminPower(req,settings.backUpData[0] + '_del')){
            DataOptionLog.remove({_id : targetId},function(err,result){
                if(err){
                    res.end(err);
                }else{
                    if(forderPath){
                        system.deleteFolder(req, res,forderPath,function(){
                            res.end('success');
                        });
                    }else{
                        res.end("删除出错");
                    }
                }
            })
        }else{
            res.end(settings.system_noPower);
        }
    }else{
        res.end(settings.system_illegal_param);
    }



});

//------------------------------------------数据管理结束





//------------------------------------------文档管理面开始
//文档添加页面(默认)
router.get('/manage/content/add/:key', function(req, res) {

    var contentType = req.params.key;
    var targetPath;

    if(contentType == "plug"){
        targetPath = 'manage/addPlugs';
    }else{
        targetPath = 'manage/addContent';
    }
    res.render(targetPath, adminFunc.setPageInfo(req,res,settings.contentList));

});

//文档编辑页面
router.get('/manage/content/edit/:type/:content', function(req, res) {
    var contentType = req.params.type;
    var targetPath;

    if(contentType == "plug"){
        targetPath = 'manage/addPlugs';
    }else{
        targetPath = 'manage/addContent';
    }
    res.render(targetPath, adminFunc.setPageInfo(req,res,settings.contentList));

});



//文章置顶
router.get('/manage/ContentList/topContent', function(req, res) {
    var params = url.parse(req.url,true);
    var contentId = params.query.uid;
    var isTop = Number(params.query.isTop);
    if(shortid.isValid(contentId)){
        if(adminFunc.checkAdminPower(req,settings.contentList[0] + '_top')){
            Content.update({_id : contentId}, {'isTop' : isTop}, function (err,result) {
                if(err) throw  err;
                res.end("success");
            })
        }else{
            res.end(settings.system_noPower);
        }
    }else{
        res.end(settings.system_illegal_param);
    }

});



//------------------------------------------文档分类管理开始

//添加新类别
function addOneCategory(req,res){
    var errors;
    var newObj = new ContentCategory(req.body);

    if(errors){
        res.end(errors);
    }else{
        newObj.save(function(err){
            if(err){
                console.log(err);
            }else{
                // 组合类别路径
                if(newObj.parentID == "0"){
                    newObj.defaultUrl = newObj.homePage;
                }else{
                    newObj.defaultUrl = newObj.defaultUrl + "/" +newObj.homePage;
                }
                // 保存完毕存储父类别结构
                newObj.sortPath = newObj.sortPath + "," +newObj._id.toString();
                newObj.save(function(err){
                    console.log('save new type ok!');
                    res.end("success");
                });

            }
        });
    }

}


//------------------------------------------文档标签开始

//添加文档标签
function addOneContentTags(req,res){
    var errors;
    var name = req.body.name;
    var alias = req.body.alias;
    var query=ContentTags.find().or([{'name' : name},{alias : alias}]);
    // 标签或别名不允许重复
    query.exec(function(err,tags){
        if(tags.length > 0){
            errors = "名称或者别名已存在！";
            res.end(errors);
        }else{
            DbOpt.addOne(ContentTags,req, res);
        }
    });
}


//------------------------------------------文档标签结束


//------------------------------------------文档模板开始

//文档模板管理（list）

//添加文档模板
function addOneContentTemps(req,res){
    var name = req.body.name;
    ContentTemplate.find({'name' : name},function(err,temp){
        if(err){
            res.end(err);
        }else{
            if(temp && temp.length > 0){
                res.end("名称不可重复！");
            }else{
                DbOpt.addOne(ContentTemplate,req, res);
            }
        }
    });
}



//读取模板文件夹信息
router.get('/manage/contentTemps/folderList', function(req, res) {

    var params = url.parse(req.url,true);
    var targetForder = params.query.defaultTemp;
    var filePath = system.scanJustFolder(settings.SYSTEMTEMPFORDER + targetForder);
    var newFilePath = [];
    for(var i=0;i<filePath.length;i++){
        var fileObj = filePath[i];
        if(fileObj.name.split('-')[1] == 'stage'){
            newFilePath.push(fileObj);
        }
    }
    // 对返回结果做初步排序
    newFilePath.sort(function(a,b){return a.type == "folder" ||  b.type == "folder"});

    return res.json(newFilePath);

});



//安装模板 包含1、从服务器下载安装包 2、解压缩到本地目录 3、入库
router.get('/manage/installTemp',function(req,res){

    if(adminFunc.checkAdminPower(req,settings.contentTemps[0] + '_add')){
        // App variables
        var params = url.parse(req.url,true);
        var tempId = params.query.tempId;

        request(settings.DORACMSAPI + '/system/template/getItem?tempId=' + tempId, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var tempObj = JSON.parse(body);

                var file_url = tempObj.filePath;
                var file_targetForlder = tempObj.alias;
                var DOWNLOAD_DIR = settings.SYSTEMTEMPFORDER + file_targetForlder.trim()+'/';
                var target_path = DOWNLOAD_DIR + url.parse(file_url).pathname.split('/').pop();

                if( fs.existsSync(DOWNLOAD_DIR) ) {
                    res.end('您已安装该模板');
                }

                fs.mkdir(DOWNLOAD_DIR,0777,function(err){
                    if(err){
                        console.log(err);
                    }
                    else {
                        download_file_httpget(file_url,function(){

                            //下载完成后解压缩
                            var extract = unzip.Extract({ path:  DOWNLOAD_DIR });
                            extract.on('error', function(err) {
                                console.log(err);
                                //解压异常处理
                            });
                            extract.on('finish', function() {
                                console.log("解压完成!!");
                                //解压完成处理入库操作
                                var tempItem = new TemplateItems();
                                tempItem.forder = "2-stage-default";
                                tempItem.name = '默认模板';
                                tempItem.isDefault = true;
                                tempItem.save(function(err){
                                    if(err){
                                        res.end(err);
                                    }else{
                                        var newTemp = new ContentTemplate(tempObj);
                                        newTemp.using = false;
                                        newTemp.items.push(tempItem);
                                        newTemp.save(function(err1){
                                            if(err1){
                                                res.end(err1);
                                            }else{
                                                res.end('success');
                                            }
                                        });

                                    }
                                });

                            });
                            fs.createReadStream(target_path).pipe(extract);

                        });
                    }

                });

                var download_file_httpget = function(file_url,callBack) {
                    var options = {
                        host: url.parse(file_url).host,
                        port: 80,
                        path: url.parse(file_url).pathname
                    };

                    var file_name = url.parse(file_url).pathname.split('/').pop();
                    var file = fs.createWriteStream(DOWNLOAD_DIR + file_name);

                    http.get(options, function(res) {
                        res.on('data', function(data) {
                            file.write(data);
                        }).on('end', function() {
                            file.end();
                            callBack(DOWNLOAD_DIR);
                        });
                    });
                };
            }
        });

    }else{
        res.end(settings.system_noPower);
    }

});


//上传自定义模板
router.post('/manage/updateCMSTemplate',function(req,res){

    var adminId = req.query.adminId;
    if(!shortid.isValid(adminId)){
        res.end(settings.system_illegal_param);
    }
    //uploadify上传会导致session丢失，暂时在第一道用原始方式鉴权，第一道并不安全，第二道会继续校验(安全)
    AdminUser.findOne({'_id':adminId}).populate('group').exec(function(err,doc){
        if(err){
            res.end(err);
        }else{
            var power = false;
            var uPower = doc.group.power;
            if(uPower){
                var newPowers = eval(uPower);
                var key = settings.contentTemps[0] + '_import';
                for(var i=0;i<newPowers.length;i++) {
                    var checkedId = newPowers[i].split(':')[0];
                    if(checkedId == key && newPowers[i].split(':')[1]){
                        power = true;
                        break;
                    }
                }
            }
            if(power){

                system.uploadTemp(req,res,function(fname){
                    var target_path = settings.SYSTEMTEMPFORDER + fname +'.zip';
                    var DOWNLOAD_DIR = settings.SYSTEMTEMPFORDER + fname +'/';
                    if( fs.existsSync(DOWNLOAD_DIR) ) {
                        res.end('您已安装该模板');
                        return;
                    }

                    var realType = system.getFileMimeType(target_path);
                    if(realType.fileType != 'zip'){
                        fs.unlinkSync(target_path);
                        res.end('类型不正确');
                        return;
                    }

                    fs.mkdir(DOWNLOAD_DIR,0777,function(err1) {
                        if (err1) {
                            console.log(err1);
                        }
                        else {
                            //下载完成后解压缩
                            var extract = unzip.Extract({ path:  DOWNLOAD_DIR });
                            extract.on('error', function(err) {
                                console.log(err);
                                //解压异常处理
                                res.end(err);
                            });
                            extract.on('finish', function() {
                                console.log("解压完成!!");
                                //解压完成处理入库操作
                                res.end('success&'+fname);

                            });
                            fs.createReadStream(target_path).pipe(extract);
                        }
                    });
                })
            }else{
                res.end(settings.system_noPower);
            }

        }

    });

});


//校验是否已经解压完成
router.get('/manage/chekcIfUnzipSuccess',function(req,res){
    var params = url.parse(req.url,true);
    var targetForder = params.query.tempId;

    var tempForder = settings.SYSTEMTEMPFORDER + targetForder;
    var DOWNLOAD_DIR = settings.SYSTEMTEMPFORDER + targetForder  + '/tempconfig.json';
    var DIST_DIR = settings.SYSTEMTEMPFORDER + targetForder  + '/dist';
    var PUBLIC_DIR = settings.SYSTEMTEMPFORDER + targetForder  + '/public';
    var USERS_DIR = settings.SYSTEMTEMPFORDER + targetForder  + '/users';
    var TWOSTAGEDEFAULT_DIR = settings.SYSTEMTEMPFORDER + targetForder  + '/2-stage-default';
    //权限校验
    if(adminFunc.checkAdminPower(req,settings.contentTemps[0] + '_import')){
        req.session.checkTempCount = 0;
        var tempTask = setInterval(function(){

            if( fs.existsSync(DOWNLOAD_DIR) && fs.existsSync(DIST_DIR)  && fs.existsSync(PUBLIC_DIR)
                && fs.existsSync(USERS_DIR) && fs.existsSync(TWOSTAGEDEFAULT_DIR)) {
                clearInterval(tempTask);
                res.end('has');
            }else{
                req.session.checkTempCount = req.session.checkTempCount + 1;
                //请求超时，文件不完整
                if(req.session.checkTempCount > 10){
                    system.deleteFolder(req, res,tempForder,function(){
                        system.deleteFolder(req, res,tempForder + '.zip',function(){
                            clearInterval(tempTask);
                            res.end('imperfect');
                        });
                    });
                }
            }

        },3000);

    }else{
        system.deleteFolder(req, res,tempForder,function(){
            system.deleteFolder(req, res,tempForder + '.zip',function(){
                res.end('nopower');
            });
        });
    }

});



//初始化导入模板的数据
router.get('/manage/initTempData',function(req,res){
    var params = url.parse(req.url,true);
    var targetForder = params.query.tempId;
    var tempForder = settings.SYSTEMTEMPFORDER + targetForder;
    if(adminFunc.checkAdminPower(req,settings.contentTemps[0] + '_import')){
        if(targetForder){
            var jsonPath = tempForder + '/tempconfig.json';
            fs.readFile(jsonPath,"binary",function (error,data) {
                if (error) {
                    res.end(error)
                } else {
                    //处理中文乱码问题
                    var buf = new Buffer(data, 'binary');
                    var newData = iconv.decode(buf, 'utf-8');

                    var tempInfoData = eval("("+newData+")")[0];
                    if(tempInfoData && tempInfoData.name && tempInfoData.alias && tempInfoData.version && tempInfoData.sImg && tempInfoData.author && tempInfoData.comment){
                        adminFunc.checkTempInfo(tempInfoData,targetForder,function(data){
                            if(data != 'success'){
                                system.deleteFolder(req, res,tempForder,function(){
                                    system.deleteFolder(req, res,tempForder + '.zip',function(){
                                        res.end(data);
                                    });
                                });

                            }else{
                                //复制静态文件到公共目录
                                var fromPath = settings.SYSTEMTEMPFORDER + targetForder + '/dist/';
                                var targetPath = settings.TEMPSTATICFOLDER + targetForder;
                                system.copyForder(fromPath,targetPath);

                                var tempItem = new TemplateItems();
                                tempItem.forder = "2-stage-default";
                                tempItem.name = '默认模板';
                                tempItem.isDefault = true;
                                tempItem.save(function(err){
                                    if(err){
                                        res.end(err);
                                    }else{
                                        var tempObj = {
                                            name:  tempInfoData.name,
                                            alias : tempInfoData.alias,
                                            version : tempInfoData.version,
                                            sImg: '/themes/' + targetForder + tempInfoData.sImg,
                                            author: tempInfoData.author,
                                            comment : tempInfoData.comment
                                        };
                                        var newTemp = new ContentTemplate(tempObj);
                                        newTemp.using = false;
                                        newTemp.items.push(tempItem);
                                        newTemp.save(function(err1){
                                            if(err1){
                                                res.end(err1);
                                            }else{
                                                system.deleteFolder(req, res,tempForder + '.zip',function(){
                                                    res.end('success');
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });

                    }else{
                        system.deleteFolder(req, res,tempForder,function(){
                            system.deleteFolder(req, res,tempForder + '.zip',function(){
                                res.end('请正确填写配置文件');
                            });
                        });
                    }

                }
            });

        }else{
            res.end('文件不完整，请稍后重试！');
        }
    }else{
        res.end(settings.system_noPower);
    }

});


//启用模板
router.get('/manage/enableTemp',function(req,res){
    var params = url.parse(req.url,true);
    var tempId = params.query.tempId;
    var alias = params.query.alias;

    if(adminFunc.checkAdminPower(req,settings.contentTemps[0] + '_modify')){

        var tempPath = system.scanJustFolder(settings.SYSTEMTEMPFORDER + alias);
        var distPath = false;
        for(var i=0;i<tempPath.length;i++){
            var fileObj = tempPath[i];
            if(fileObj.name == 'dist'){
                distPath = true;
                break;
            }
        }
        //服务器配置不同解压缩时间有所差异，暂时用该办法控制
        if(!distPath){
            res.end('服务器正在解压缩，请10s后重试！')
        }else{
            ContentTemplate.setTempState('',false,function(err){
                if(err){
                    res.end(err);
                }else{
                    ContentTemplate.setTempState(tempId,true,function(err1,doc){
                        if(err1){
                            res.end(err1);
                        }else{
                            //复制静态文件到公共目录
                            var fromPath = settings.SYSTEMTEMPFORDER + doc.alias + '/dist/';
                            var targetPath = settings.TEMPSTATICFOLDER + doc.alias;
                            system.copyForder(fromPath,targetPath);
                            ContentTemplate.getDefaultTemp(res,function(temp){
                                if(temp){
                                    cache.set(settings.session_secret + '_siteTemplate', temp , 1000 * 60 * 60 * 24); // 修改默认模板缓存
                                }
                                //重置类别模板
                                ContentCategory.update({},{$set:{contentTemp:''}},{multi : true},function(err2){
                                    if(err2){
                                        res.end(err2);
                                    }else{
                                        res.end('success');
                                    }
                                });

                            });
                        }
                    })
                }
            })
        }

    }else{
        res.end(settings.system_noPower);
    }

});

//添加模板单元
router.post('/manage/templateItem/addNew',function(req,res){
    var params = url.parse(req.url,true);
    var defaultTemp = params.query.defaultTemp;

    if(adminFunc.checkAdminPower(req,settings.CONTENTTEMPITEMS[0] + '_add')){
        var tempItem = new TemplateItems(req.body);
        tempItem.save(function(err){
            if(err){
                res.end(err);
            }else{
                ContentTemplate.getDefaultTemp(res,function(doc){
                    if(doc){
                        doc.items.push(tempItem);
                        doc.save(function(err1){
                            if(err1){
                                res.end(err1);
                            }else{
                                cache.set(settings.session_secret + '_siteTemplate', doc , 1000 * 60 * 60 * 24); // 修改默认模板缓存
                                res.end('success');
                            }
                        });
                    }else{
                        res.end(settings.system_illegal_param);
                    }
                });
            }
        });
    }else{
        res.end(settings.system_noPower);
    }

});


//删除模板单元
function removeTemplateItem(req,res){

    var params = url.parse(req.url,true);
    var targetId = params.query.uid;
    if(shortid.isValid(targetId)){
        TemplateItems.remove({_id : params.query.uid},function(err,result){
            if(err){
                res.end(err);
            }else{
                ContentTemplate.getDefaultTemp(res,function(doc){
                    if(doc){
                        var items = doc.items;
                        for(var i=0;i<items.length;i++){
                            if(items[i] == targetId){
                                items.splice(i,1);
                                break;
                            }
                        }
                        doc.items = items;
                        doc.save(function(err){
                            if(err){
                                res.end(err);
                            }else{
                                //更新缓存
                                cache.set(settings.session_secret + '_siteTemplate', doc , 1000 * 60 * 60 * 24); // 修改默认模板缓存
                                res.end("success");
                            }
                        });
                    }else{
                        res.end(settings.system_illegal_param);
                    }
                });

            }
        })
    }else{
        res.end(settings.system_illegal_param);
    }

}


//删除指定模板
function removeTemplate(req,res){
    var params = url.parse(req.url,true);
    var targetId = params.query.uid;

    if(shortid.isValid(targetId)){
        adminFunc.delRefObjById(res,ContentTemplate,TemplateItems,targetId,function(doc){
            //删除模板文件夹
            var tempPath = settings.SYSTEMTEMPFORDER + doc.alias;
            var tempStaticPath = settings.TEMPSTATICFOLDER + doc.alias;
            system.deleteFolder(req, res,tempPath,function(){
                system.deleteFolder(req, res,tempStaticPath,function(){
                    res.end('success');
                });
            });
        });

    }else{
        res.end(settings.system_illegal_param);
    }

}

//获取右侧模板文件树
router.get('/manage/contentTemps/tempListByFolder', function(req, res) {
    var params = url.parse(req.url,true);
    var targetTemp = params.query.targetTemp;

    if(adminFunc.checkAdminPower(req,settings.contentTemps[0] + '_view')){
        if(targetTemp == 'undefined'){
            ContentTemplate.getDefaultTemp(res,function(temp){
                if(temp){
                    var tempTree = setTempData(temp.alias);
                    return res.json(tempTree);
                }else{
                    return res.json({});
                }
            });
        }else{
            var tempTree = setTempData(targetTemp);
            return res.json(tempTree);
        }

    }else{
        return res.json({});
    }

});

function setTempData(targetTemp){
    var tempTree = [];
    tempTree.push({
        id : 'public',
        pId:0,
        name:"公用模块",
        open:false
    });
    tempTree.push({
        id : 'users',
        pId:0,
        name:"用户模块",
        open:true
    });
    tempTree.push({
        id : 'styles',
        pId:0,
        name:"模板样式",
        open:true
    });
    tempTree.push({
        id : 'js',
        pId:0,
        name:"模板js",
        open:true
    });

    //读取ejs模板
    var newPubPath = adminFunc.setTempParentId(system.scanFolder(settings.SYSTEMTEMPFORDER,targetTemp + "/public"),'public');
    var newUserPath = adminFunc.setTempParentId(system.scanFolder(settings.SYSTEMTEMPFORDER,targetTemp + "/users"),'users');
    newPubPath = newPubPath.concat(newUserPath);
    //读取静态文件
    if( fs.existsSync(settings.TEMPSTATICFOLDER + targetTemp) ) {
        var newStylePath = adminFunc.setTempParentId(system.scanFolder(settings.TEMPSTATICFOLDER , targetTemp + "/css"),'styles');
        var newJsPath = adminFunc.setTempParentId(system.scanFolder(settings.TEMPSTATICFOLDER , targetTemp + "/js"),'js');
        newPubPath = newPubPath.concat(newStylePath).concat(newJsPath)
    }
    //读取模板单元
    var filePath = system.scanJustFolder(settings.SYSTEMTEMPFORDER + targetTemp);
    var tempUnit = [];
    tempUnit.push({
        id : 'tempUnit',
        pId:0,
        name : '模板单元',
        open:true
    });
    for(var i=0;i<filePath.length;i++){
        var fileObj = filePath[i];
        if(fileObj.name.split('-')[1] == 'stage'){
            tempUnit.push({
                id : fileObj.name,
                pId: 'tempUnit',
                name : fileObj.name,
                open:true
            });
            var unitArr = system.scanFolder(settings.SYSTEMTEMPFORDER , targetTemp + '/' + fileObj.name);
            var newUnitArr = adminFunc.setTempParentId(unitArr,fileObj.name);
            tempUnit = tempUnit.concat(newUnitArr);
        }
    }
    if(tempUnit.length > 0){
        newPubPath = newPubPath.concat(tempUnit);
    }

    //读取根目录下的所有文件
    var rootArr = system.scanFolder(settings.SYSTEMTEMPFORDER , targetTemp);
    var newRootArr = [];
    for(var j=0;j<rootArr.length;j++){
        var rootObj = rootArr[j];
        if(rootObj.type == 'ejs'){
            var rootFile = adminFunc.setTempParentId(rootObj,0);
            newRootArr.push(rootFile);
        }
    }
    if(newRootArr.length > 0) {
        newPubPath = newPubPath.concat(newRootArr);
    }

    tempTree = tempTree.concat(newPubPath);
    tempTree.sort();
    return tempTree;
}


//修改文件内容读取文件信息
router.get('/manage/contentTemps/getFileInfo', function(req, res) {

    if(adminFunc.checkAdminPower(req,settings.contentTemps[0] + '_view')){
        var params = url.parse(req.url,true);
        if((params.query.filePath).indexOf('../') >= 0){
            res.end(settings.system_noPower);
        }

        var path = adminFunc.getTempBaseFile(params.query.filePath) + params.query.filePath;
        if(path){
            system.readFile(req,res,path);
        }else{
            res.end(settings.system_noPower);
        }
    }else{
        return res.json({
            fileData : {}
        })
    }
});

//修改文件内容更新文件信息
router.post('/manage/contentTemps/updateFileInfo', function(req, res) {

    var fileContent = req.body.code;
    if((req.body.path).indexOf('../') >= 0){
        res.end(settings.system_noPower);
    }

    var path = adminFunc.getTempBaseFile(req.body.path) + req.body.path;
    if(adminFunc.checkAdminPower(req,settings.contentTemps[0] + '_modify')){
        if(path){
            system.writeFile(req,res,path,fileContent);
        }else{
            res.end(settings.system_noPower);
        }
    }else{
        res.end(settings.system_noPower);
    }
});


//获取已安装的所有模板
router.get('/manage/contentTemps/tempFolderList', function(req, res) {

    if(adminFunc.checkAdminPower(req,settings.contentTemps[0] + '_view')){
        ContentTemplate.find({}).sort({using : -1}).populate('items').exec(function(err,docs){
            if(err){
                res.end(err);
            }else{
                return res.json(docs);
            }
        });

    }else{
        return res.json({});
    }

});
//------------------------------------------文档模板结束





//------------------------------------------文档留言开始

//管理员回复用户
function replyMessage(req,res){

    var errors;
    var contentId = req.body.contentId;
    var contentTitle = req.body.contentTitle;
    var adminAuthorId = req.session.adminUserInfo._id;
    var replyId = req.body.replyId;
    var replyEmail = req.body.replyEmail;
    var content = req.body.content;
    var utype = req.body.utype;
    var relationMsgId = req.body.relationMsgId;

    if(!shortid.isValid(contentId) || !contentTitle){
        errors = settings.system_illegal_param;
    }
    if(!adminAuthorId || !replyId){
        errors = settings.system_illegal_param;
    }
    if(replyEmail && !validator.isEmail(replyEmail)){
        errors = settings.system_illegal_param;
    }

    if(errors){
        res.end(errors);
    }else{

        req.body.adminAuthor = new AdminUser({_id : adminAuthorId , userName : req.session.adminUserInfo.userName});
        req.body.replyAuthor = new User({_id : replyId , email : replyEmail});
        var newMsg = new Message(req.body);
        newMsg.save(function(){
            // 更新评论数
            Content.updateCommentNum(contentId,'add',function(){
                // 给用户发送提醒邮件
                system.sendEmail(settings.email_notice_user_contentMsg,newMsg,function(err){
                    if(err){
                        res.end(err);
                    }
                });

                res.end("success");
            });

        });

    }
}
//------------------------------文档留言结束------------



//--------------------广告管理开始---------------------------


//广告添加页面
router.get('/manage/ads/addTxt', function(req, res) {

    adminFunc.renderToManagePage(req, res,'manage/addTxtAds',settings.adsList);

});

//初始化添加图片广告
router.get('/manage/ads/addImg', function(req, res) {
    if(adminFunc.checkAdminPower(req,settings.adsList[0] + '_add')){
        var newImgAds = new Ads({
            name : '默认图片广告',
            state : '1',
            type : '1'
        });
        newImgAds.save(function(err){
            if(err){
                res.end(err);
            }
            res.redirect('/admin/manage/ads/addImgAds/'+newImgAds._id);
        })
    }else{
        adminFunc.renderToManagePage(req, res,'manage/addSliderAds',settings.adsList);
    }
});

router.get('/manage/ads/addImgAds/:defaultUrl', function(req, res) {
    adminFunc.renderToManagePage(req, res,'manage/addSliderAds',settings.adsList);
});


//添加图片广告单元
router.post('/manage/adsItems/addItem', function(req, res) {
    var params = url.parse(req.url,true);
    var adsId = params.query.adsId;
    if(adminFunc.checkAdminPower(req,settings.adsList[0] + '_add')){
        Ads.findOne({'_id' : adsId},function(err,doc){
            if(doc){
                newAdsItem = new AdsItems(req.body);
                newAdsItem.save(function(err){
                    if(err){
                        res.end(err);
                    }else{
                        doc.items.push(newAdsItem);
                        doc.save(function(err1){
                            if(err1){
                                res.end(err1);
                            }
                            res.end("success");
                        });
                    }
                });
            }else{
                res.end(settings.system_illegal_param);
            }
        })
    }else{
        res.end(settings.system_noPower);
    }
});

//修改图片广告单元
router.post('/manage/adsItems/modifyItem', function(req, res) {
    var params = url.parse(req.url,true);
    var adsId = params.query.adsId;
    if(adminFunc.checkAdminPower(req,settings.adsList[0] + '_modify')){
        Ads.findOne({'_id' : adsId},function(err,doc){
            if(doc){
                DbOpt.updateOneByID(AdsItems,req,res,'');
            }else{
                res.end(settings.system_illegal_param);
            }
        })
    }else{
        res.end(settings.system_noPower);
    }
});

//删除图片单元
router.get('/manage/adsItems/delItem', function(req, res) {
    var params = url.parse(req.url,true);
    var adsId = params.query.adsId;
    if(adminFunc.checkAdminPower(req,settings.adsList[0] + '_del')){
        adminFunc.delSonRefObjById(res,Ads,AdsItems,adsId,params.query.uid,function(){
            res.end("success");
        });
    }else{
        res.end(settings.system_noPower);
    }
});

//查询单个图片单元
router.get('/manage/adsItems/findItem',function(req,res){
    if(adminFunc.checkAdminPower(req,settings.adsList[0] + '_view')){
        DbOpt.findOne(AdsItems,req,res,'');
    }else{
        res.end(settings.system_noPower);
    }
});

//新增广告(文本广告)
function addOneAds(req,res){
    var name = req.body.name;
    var type = req.body.type;
    var title = req.body.title;
    var link = req.body.link;
    if(adminFunc.checkAdminPower(req,settings.adsList[0] + '_add')){
        var adsItemObj = new AdsItems({
            title : req.body.title,
            link : req.body.link
        });
        adsItemObj.save(function(err){
            if(err){
                res.end(err);
            }else{
                var adsObj = new Ads(req.body);
                adsObj.items.push(adsItemObj);
                adsObj.save(function(err1){
                    if(err1){
                        res.end(err1);
                    }
                    res.end('success');
                })
            }
        })
    }else{
        res.end(settings.system_noPower);
    }
}


//广告编辑页面
router.get('/manage/ads/edit/:content', function(req, res) {

    adminFunc.renderToManagePage(req, res,'manage/addTxtAds',settings.adsList);

});

//修改文本广告
router.post('/manage/sysTemManage_ads/modifyTxtAds', function(req, res) {

    var params = url.parse(req.url,true);
    var adsId = params.query.uid;
    var name = req.body.name;
    var type = req.body.type;
    var state = req.body.state;
    var title = req.body.title;
    var link = req.body.link;
    if(adminFunc.checkAdminPower(req,settings.adsList[0] + '_modify')){
        Ads.findOneAndUpdate({'_id':adsId},{$set : {'name':name,'type':type,'state':state}},function(err,doc){
            if(err){
                res.end(err);
            }
            if(doc){
                AdsItems.update({'_id' : doc.items[0]},{$set : {'title':title,'link':link}},function(err1){
                    if(err1){
                        res.end(err1)
                    }else{
                        res.end('success');
                    }
                })
            }else{
                res.end(settings.system_illegal_param)
            }
        });
    }else{
        res.end(settings.system_noPower);
    }
});

//删除指定广告
function removeAds(req,res){
    var params = url.parse(req.url,true);
    var targetId = params.query.uid;

    adminFunc.delRefObjById(res,Ads,AdsItems,targetId,function(){
        res.end('success');
    });

}

//--------------------消息管理开始---------------------------

//管理员公告编辑页面
router.get('/manage/adminNotice/edit/:noticeId', function(req, res) {
    res.render('manage/addNotice', adminFunc.setPageInfo(req,res,settings.systemNotice));

});

//管理员公告新增页面
router.get('/manage/adminNotice/add', function(req, res) {

    res.render('manage/addNotice', adminFunc.setPageInfo(req,res,settings.systemNotice));

});


function addOneNotice(req,res){
    req.body.type = '1';
    req.body.adminSender = new AdminUser({_id : req.session.adminUserInfo._id});
    var notify = new Notify(req.body);
    notify.save(function(err){
        if(err){
            res.end(err);
        }else{
            User.find({},'_id',function (err,users) {
                if(err){
                    res.end(err);
                }else{
                    if(users.length > 0){
                        for(var i=0;i<users.length;i++){
                            var userNotify = new UserNotify();
                            userNotify.user = users[i]._id;
                            userNotify.notify = notify;
                            userNotify.save(function(err){
                                if(err){
                                    res.end(err);
                                }
                            });
                        }
                    }
                    res.end('success');
                }
            });
        }
    });
}



//设置为已读消息
router.get('/userNotify/setHasRead',function(req,res){
    var params = url.parse(req.url,true);
    var currentId = params.query.msgId;

    if(adminFunc.checkAdminPower(req,settings.sysTemBackStageNotice[0] + '_modify')){
        if(currentId){
            UserNotify.setHasRead(currentId,function(err){
                if(err){
                    res.end(err);
                }else{
                    adminFunc.getAdminNotices(req,res,function(noticeObj){
                        req.session.adminNotices = noticeObj;
                        res.end('success');
                    });

                }
            });
        }else{
            res.end(settings.system_illegal_param);
        }
    }else{
        res.end(settings.system_noPower);
    }

});

module.exports = router;