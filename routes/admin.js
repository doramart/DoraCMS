var express = require('express');
var router = express.Router();
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
//文章留言对象
var Message = require("../models/Message");
//注册用户对象
var User = require("../models/User");
//广告对象
var Ads = require("../models/Ads");
//数据校验
var validator = require('validator');
//短id
var shortid = require('shortid');
//系统操作
var system = require("../util/system");
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
/* GET home page. */

var PW = require('png-word');
var RW = require('../util/randomWord');
var rw = RW('abcdefghijklmnopqrstuvwxyz1234567890');
var pngword = new PW(PW.GRAY);



var returnAdminRouter = function(io) {

    //管理员登录页面
    router.get('/', function(req, res, next) {
        res.render('manage/adminLogin', { title: settings.SITETITLE , description : 'DoraCMS后台管理登录'});
    });


//管理员登录验证码
    router.get('/vnum',function(req, res){

        var word = rw.random(4);
        req.session.vnum = word;
        pngword.createReadStream(word).pipe(res);
    });



// 管理员登录提交请求
    router.post('/doLogin', function(req, res, next) {
        var userName = req.body.userName;
        var password = req.body.password;
        var vnum = req.body.vnum;
        var newPsd = DbOpt.encrypt(password,settings.encrypt_key);

        if(vnum != req.session.vnum){
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
//                    存入操作日志
                        var loginLog = new SystemOptionLog();
                        loginLog.type = 'login';
                        loginLog.logs = user.userName + ' 登录，IP:' + adminFunc.getClienIp(req);
                        loginLog.save(function (err) {
                            if (err) {
                                res.end(err);
                            }
                        });
                        res.end("success");
                    }else
                    {
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
    router.get('/logout', function(req, res, next) {
        req.session.adminlogined = false;
        req.session.adminPower = '';
        req.session.adminUserInfo = '';
        res.redirect("/admin");
    });

//后台用户起始页
    router.get('/manage', function(req, res, next) {
        res.render('manage/main', adminFunc.setPageInfo(req,res,settings.SYSTEMMANAGE));
    });



//对象列表查询
    router.get('/manage/getDocumentList/:defaultUrl',function(req,res,next){

        var currentPage = req.params.defaultUrl;
        if(adminFunc.checkAdminPower(req,currentPage + '_view')){

            var targetObj = adminFunc.getTargetObj(currentPage);
            var params = url.parse(req.url,true);
            var keywords = params.query.searchKey;
            var keyPr = [];

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
                    keyPr.push({'mkey' : { $regex: reKey } });
                    keyPr.push({'title' : { $regex: reKey } });
                }
            }

            DbOpt.pagination(targetObj,req, res,keyPr);

        }else{
            return res.json({});
        }

    });



//对象删除
    router.get('/manage/:defaultUrl/del',function(req,res,next){
        var currentPage = req.params.defaultUrl;
        var params = url.parse(req.url,true);
        var targetObj = adminFunc.getTargetObj(currentPage);
        if(adminFunc.checkAdminPower(req,currentPage + '_del')){
            if(targetObj == Message){
                removeMessage(req,res)
            }else if(targetObj == Notify){
                Notify.delOneNotify(res,params.query.uid,function(){
                    var notifyQuery = {'notify': { $regex: new RegExp(params.query.uid, 'i') }};
                    UserNotify.remove(notifyQuery,function(err){
                        if(err){
                            res.end(err);
                        }else{
                            res.end("success");
                        }
                    });
                });
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
            }else{
                DbOpt.del(targetObj,req,res,"del one obj success");
            }
        }else{
            res.end('对不起，您无权执行该操作！');
        }

    });

//批量删除对象
    router.get('/manage/:defaultUrl/batchDel',function(req,res,next){
        var currentPage = req.params.defaultUrl;
        var params = url.parse(req.url,true);
        var targetObj = adminFunc.getTargetObj(currentPage);
        var ids = params.query.ids;
        if(adminFunc.checkAdminPower(req,currentPage + '_del')){
            var idsArr = ids.split(',');
            if(idsArr.length > 0){

                if(targetObj == Message || targetObj == AdminGroup || targetObj == AdminUser || targetObj == Notify){
                    res.end('对不起，该模块不允许批量删除！');
                }else{

                    targetObj.remove({'_id':{$in: idsArr}},function(err){
                        if(err){
                            res.end(err);
                        }else{
                            res.end("success");
                        }
                    });

                }
            }else{
                res.end('请选择至少一项后再执行删除操作！');
            }

        }else{
            res.end('对不起，您无权执行该操作！');
        }

    });

//获取单个对象数据
    router.get('/manage/:defaultUrl/item',function(req,res,next){
        var currentPage = req.params.defaultUrl;
        var targetObj = adminFunc.getTargetObj(currentPage);
        if(adminFunc.checkAdminPower(req,currentPage + '_view')){
            if(targetObj == AdminUser){
                var params = url.parse(req.url,true);
                var targetId = params.query.uid;
                if(shortid.isValid(targetId)){
                    AdminUser.findOne({'_id' : targetId}).populate('group').exec(function(err,user){
                        if(err){
                            res.end(err);
                        }
                        if(user){
                            return res.json(user);
                        }
                    })
                }else{
                    res.end(settings.system_illegal_param);
                }

            }else{
                DbOpt.findOne(targetObj,req, res,"find one obj success");
            }

        }else{
            return res.json({});
        }

    });



//更新单条记录(执行更新)
    router.post('/manage/:defaultUrl/modify',function(req,res,next){
        var currentPage = req.params.defaultUrl;
        var targetObj = adminFunc.getTargetObj(currentPage);
        var params = url.parse(req.url,true);
        if(adminFunc.checkAdminPower(req,currentPage + '_modify')){
            if(targetObj == AdminUser || targetObj == User){
                req.body.password = DbOpt.encrypt(req.body.password,settings.encrypt_key);
            }else if(targetObj == AdminGroup){
                if(params.query.uid == req.session.adminUserInfo.group._id){
                    req.session.adminPower = req.body.power;
                }
            }
            DbOpt.updateOneByID(targetObj,req, res,"update one obj success")
        }else{
            res.end('对不起，您无权执行该操作！');
        }

    });


//对象新增
    router.post('/manage/:defaultUrl/addOne',function(req,res,next){

        var currentPage = req.params.defaultUrl;
        var targetObj = adminFunc.getTargetObj(currentPage);

        if(adminFunc.checkAdminPower(req,currentPage + '_add')){
            if(targetObj == AdminUser){
                addOneAdminUser(req,res);
            }else if(targetObj == ContentCategory){
                addOneCategory(req,res)
            }else if(targetObj == ContentTags){
                addOneContentTags(req,res)
            }else if(targetObj == ContentTemplate){
                addOneContentTemps(req,res)
            }else if(targetObj == Message){
                replyMessage(req,res);
            }else if(targetObj == Notify){
                addOneNotice(req,res);
            }else{
                DbOpt.addOne(targetObj,req, res);
            }
        }else{
            res.end('对不起，您无权执行该操作！');
        }


    });



//删除留言
    function removeMessage(req,res){
        var params = url.parse(req.url,true);
        var targetId = params.query.uid;
        if(shortid.isValid(targetId)){
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
        }else{
            res.end(settings.system_illegal_param);
        }

    }


//系统用户管理（list）
    router.get('/manage/adminUsersList', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/adminUsersList',settings.ADMINUSERLIST);


    });



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
                        //    密码加密
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



//------------------------------------------用户组管理面开始

//系统用户组管理（list）
    router.get('/manage/adminGroupList', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/adminGroup',settings.ADMINGROUPLIST);

    });

//系统管理员用户组列表
    router.get('/manage/adminGroupList/list', function(req, res, next) {
        if(adminFunc.checkAdminPower(req,settings.ADMINGROUPLIST[0] + '_view')){
            DbOpt.findAll(AdminGroup,req, res,"request adminGroupList")
        }else{
            return res.json({});
        }
    });


//------------------------------------------用户组管理面结束




//------------------------------------------文件管理器开始

//文件管理界面（list）
    router.get('/manage/filesList', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/filesList',settings.FILESLIST);

    });


//文件夹列表查询
    router.get('/manage/filesList/list', function(req, res, next) {
        var params = url.parse(req.url,true);
        var path = params.query.filePath;
        if(!path){
            path =  settings.UPDATEFOLDER;
        }

        if(adminFunc.checkAdminPower(req,settings.FILESLIST[0] + '_view')){
            var filePath = system.scanFolder(path);
//    对返回结果做初步排序
            filePath.sort(function(a,b){return a.type == "folder" ||  b.type == "folder"});
            return res.json({
                rootPath : settings.UPDATEFOLDER,
                pathsInfo : filePath
            });
        }else{
            return res.json({});
        }


    });


//文件删除
    router.get('/manage/filesList/fileDel', function(req, res, next) {
        var params = url.parse(req.url,true);
        var path = params.query.filePath;
        if(adminFunc.checkAdminPower(req,settings.FILESLIST[0] + '_del')){
            if(path){
                system.deleteFolder(req, res, path);
            }else{
                res.end('您的请求不正确，请稍后再试');
            }
        }else{
            res.end('对不起，您无权执行该操作！');
        }

    });

//文件重命名
    router.post('/manage/filesList/fileReName', function(req, res, next) {
        var newPath = req.body.newPath;
        var path = req.body.path;
        if(adminFunc.checkAdminPower(req,settings.FILESLIST[0] + '_modify')){
            if(path && newPath){
                system.reNameFile(req,res,path,newPath);
            }else{
                res.end('您的请求不正确，请稍后再试');
            }
        }else{
            res.end('对不起，您无权执行该操作！');
        }

    });

//修改文件内容读取文件信息
    router.get('/manage/filesList/getFileInfo', function(req, res, next) {

        if(adminFunc.checkAdminPower(req,settings.FILESLIST[0] + '_view')){
            var params = url.parse(req.url,true);
            var path = params.query.filePath;
            if(path){
                system.readFile(req,res,path);
            }else{
                res.end('您的请求不正确，请稍后再试');
            }
        }else{
            return res.json({
                fileData : {}
            })
        }
    });

//修改文件内容更新文件信息
    router.post('/manage/filesList/updateFileInfo', function(req, res, next) {

        var fileContent = req.body.code;
        var path = req.body.path;
        if(adminFunc.checkAdminPower(req,settings.FILESLIST[0] + '_modify')){
            if(path){
                system.writeFile(req,res,path,fileContent);
            }else{
                res.end('您的请求不正确，请稍后再试');
            }
        }else{
            res.end('对不起，您无权执行该操作！');
        }
    });

//------------------------------------------文件管理器结束


//------------------------------------------数据管理开始

    router.get('/manage/dataManage/m/backUpData', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/backUpData',settings.BACKUPDATA);

    });


//备份数据库执行
    router.get('/manage/backupDataManage/backUp', function(req, res, next) {
        if(adminFunc.checkAdminPower(req,settings.BACKUPDATA[0] + '_backup')) {
            system.backUpData(res, req);
        }else{
            res.end('对不起，您无权执行该操作！');
        }
    });


//备份数据记录删除
    router.get('/manage/backupDataManage/delItem', function(req, res, next) {

        var params = url.parse(req.url,true);
        var forderPath = params.query.filePath;
        var targetId = params.query.uid;
        if(shortid.isValid(targetId)){
            if(adminFunc.checkAdminPower(req,settings.BACKUPDATA[0] + '_del')){
                DataOptionLog.remove({_id : targetId},function(err,result){
                    if(err){
                        res.end(err);
                    }else{
                        if(forderPath){
                            system.deleteFolder(req, res,forderPath);
                        }else{
                            res.end("删除出错");
                        }
                    }
                })
            }else{
                res.end('对不起，您无权执行该操作！');
            }
        }else{
            res.end(settings.system_illegal_param);
        }



    });

//------------------------------------------数据管理结束


//------------------------------------------系统日志管理开始

    router.get('/manage/systemLogs', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/systemLogs',settings.SYSTEMLOGS);

    });

//------------------------------------------系统日志管理结束



//------------------------------------------文档管理面开始
//文档列表页面
    router.get('/manage/contentList', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/contentList',settings.CONTENTLIST);


    });



//文档添加页面(默认)
    router.get('/manage/content/add/:key', function(req, res, next) {

        var contentType = req.params.key;
        var targetPath;

        if(contentType == "plug"){
            targetPath = 'manage/addPlugs';
        }else{
            targetPath = 'manage/addContent';
        }

        res.render(targetPath, adminFunc.setPageInfo(req,res,settings.CONTENTLIST));


    });



//文档编辑页面
    router.get('/manage/content/edit/:type/:content', function(req, res, next) {
        var contentType = req.params.type;
        var targetPath;

        if(contentType == "plug"){
            targetPath = 'manage/addPlugs';
        }else{
            targetPath = 'manage/addContent';
        }
        res.render(targetPath, adminFunc.setPageInfo(req,res,settings.CONTENTLIST));

    });



//文章置顶
    router.get('/manage/ContentList/topContent', function(req, res, next) {
        var params = url.parse(req.url,true);
        var contentId = params.query.uid;
        var isTop = Number(params.query.isTop);
        if(shortid.isValid(contentId)){
            if(adminFunc.checkAdminPower(req,settings.CONTENTLIST[0] + '_top')){
                Content.update({_id : contentId}, {'isTop' : isTop}, function (err,result) {
                    if(err) throw  err;
                    res.end("success");
                })
            }else{
                res.end('对不起，您无权执行该操作！');
            }
        }else{
            res.end(settings.system_illegal_param);
        }

    });



//------------------------------------------文档分类管理开始
//文档类别列表页面
    router.get('/manage/contentCategorys', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/contentCategorys',settings.CONTENTCATEGORYS);

    });

//文章类别列表
    router.get('/manage/contentCategorys/list', function(req, res, next) {
        if(adminFunc.checkAdminPower(req,settings.CONTENTCATEGORYS[0] + '_view')){
            return res.json(ContentCategory.find({}).sort({'sortId': 1}));
        }else{
            return res.json({});
        }

    });

//添加新类别
    function addOneCategory(req,res){
        var errors;
        var contentTemp = req.body.contentTemp;

        if(!contentTemp){
            errors = '请选择文档类别!';
        }
        var newObj = new ContentCategory(req.body);

        if(errors){
            res.end(errors);
        }else{
            newObj.save(function(err){
                if(err){
                    console.log(err);
                }else{
//            组合类别路径
                    if(newObj.parentID == "0"){
                        newObj.defaultUrl = newObj.homePage;
                    }else{
                        newObj.defaultUrl = newObj.defaultUrl + "/" +newObj.homePage;
                    }
//            保存完毕存储父类别结构
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

//文档标签管理（list）
    router.get('/manage/contentTags', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/contentTags',settings.CONTENTTAGS);

    });

//所有标签列表
    router.get('/manage/contentTags/list', function(req, res, next) {
        if(adminFunc.checkAdminPower(req,settings.CONTENTTAGS[0] + '_view')){
            DbOpt.findAll(ContentTags,req, res,"request ContentTags List")
        }else{
            return res.json({});
        }

    });



//添加文档标签
    function addOneContentTags(req,res){
        var errors;
        var name = req.body.name;
        var alias = req.body.alias;
        var query=ContentTags.find().or([{'name' : name},{alias : alias}]);
//    标签或别名不允许重复
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
    router.get('/manage/contentTemps', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/contentTemps',settings.CONTENTTEMPS);

    });

//所有模板列表
    router.get('/manage/contentTemps/list', function(req, res, next) {
        if(adminFunc.checkAdminPower(req,settings.CONTENTTEMPS[0] + '_view')){
            DbOpt.findAll(ContentTemplate,req, res,"request ContentTemps List");
        }else{
            return res.json({});
        }

    });



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

//              更新评论数
                Content.updateCommentNum(contentId,'add',function(){
//                给用户发送提醒邮件
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



//读取模板文件夹信息
    router.get('/manage/contentTemps/forderList', function(req, res, next) {

        var filePath = system.scanJustFolder(settings.TEMPSFOLDER);
//    对返回结果做初步排序
        filePath.sort(function(a,b){return a.type == "folder" ||  b.type == "folder"});

        return res.json(filePath);

    });
//------------------------------------------文档模板结束





//------------------------------------------文档留言开始

//文档留言管理（list）
    router.get('/manage/contentMsgs', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/messageList',settings.MESSAGEMANAGE);

    });


//------------------------------------------文档留言结束




//------------------------------注册用户管理开始
//注册用户管理（list）
    router.get('/manage/regUsersList', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/regUsersList',settings.REGUSERSLIST);

    });




//--------------------广告管理开始---------------------------
//广告管理列表页面
    router.get('/manage/adsList', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/adsList',settings.ADSLIST);

    });



//广告添加页面
    router.get('/manage/ads/add', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/addAds',settings.ADSLIST);

    });

//广告编辑页面
    router.get('/manage/ads/edit/:content', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/addAds',settings.ADSLIST);

    });


//--------------------消息管理开始---------------------------
//管理员公告列表页面
    router.get('/manage/noticeManage/m/adminNotice', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/adminNotice',settings.SYSTEMNOTICE);

    });

//管理员公告编辑页面
    router.get('/manage/adminNotice/edit/:noticeId', function(req, res, next) {

        res.render('manage/addNotice', adminFunc.setPageInfo(req,res,settings.SYSTEMNOTICE));

    });

//管理员公告新增页面
    router.get('/manage/adminNotice/add', function(req, res, next) {

        res.render('manage/addNotice', adminFunc.setPageInfo(req,res,settings.SYSTEMNOTICE));

    });


//用户消息管理列表
    router.get('/noticeManage/m/userNotice', function(req, res, next) {

        adminFunc.renderToManagePage(req, res,'manage/userNotice',settings.USERNOTICE);

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
                                var targetUserId = users[i]._id;
                                var targetNo = i;
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


//--------------------系统管理首页开始---------------------------
//获取系统首页数据集合
    router.get('/manage/getMainInfo', function(req, res, next) {
        adminFunc.setMainInfos(req, res);
    });


//用户bug反馈
    router.post('/message/sent', function(req, res, next) {

        var newObj = {
            contentFrom : req.body.contentFrom,
            email : req.body.email,
            content : req.body.content
        };

        system.sendEmail(settings.email_notice_contentBug,newObj,function(err){
            if(err){
                res.end(err);
            }else{
                res.end("success");
            }
        });

    });

    return router;
};



module.exports = returnAdminRouter;
