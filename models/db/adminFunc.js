/**
 * Created by Administrator on 2015/8/31.
 */
var url = require('url');
var settings = require("./settings");
//数据库操作对象
var DbOpt = require("../Dbopt");

//管理员对象
var AdminUser = require("../AdminUser");
//管理员用户组对象
var AdminGroup = require("../AdminGroup");
// 文档对象
var Content = require("../Content");
//数据操作日志
var DataOptionLog = require("../DataOptionLog");
//文章类别对象
var ContentCategory = require("../ContentCategory");
//文章标签对象
var ContentTags = require("../ContentTags");
//文章模板对象
var ContentTemplate = require("../ContentTemplate");
var TemplateItems = require("../TemplateItems");
//文章留言对象
var Message = require("../Message");
//注册用户对象
var User = require("../User");
//广告对象
var Ads = require("../Ads");
//文件对象
var Files = require("../Files");
//系统日志对象
var SystemOptionLog = require("../SystemOptionLog");
//消息对象
var Notify = require("../Notify");
var UserNotify = require("../UserNotify");
var shortid = require('shortid');
//数据校验
var validator = require("validator");
var system = require('../../util/system');
var request = require('request');
var adminFunc = {

    siteInfos : function (description) {

        return {
            title : settings.SITETITLE,
            description : description,
            version : settings.SITEVERSION
        }
    },

    getMessageList : function(){
        return Message.find({}).limit(10).sort({'date' : -1}).populate('author').populate('replyAuthor').populate('adminAuthor').exec();
    },

    getClienIp : function(req){

        return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

    },

    setMainInfos : function(req, res){
        return res.json({
            adminUserCount : AdminUser.count({}),
            regUsersCount : User.count({}),
            contentsCount : Content.count({}),
            msgCount : Message.count({}),
            msgList : this.getMessageList(),
            regUsers : User.find({}).limit(15).sort({'date' : -1})
        })
    },

    setPageInfo : function(req,res,module){

        var searchKey = '';
        //area是为了独立查询一个表其中的部分数据而设立的参数
        var area = '';
        if(req.url){
            var params = url.parse(req.url,true);
            searchKey = params.query.searchKey;
            area = req.query.area;
        }

        return {
            siteInfo : this.siteInfos(module[1]),
            bigCategory : module[0],
            searchKey : searchKey,
            area : area,
            currentLink : req.originalUrl,
            layout : 'manage/public/adminTemp'
        }

    },

    setDataForInfo : function(infoType,infoContent){

        return {
            siteInfo : this.siteInfos('系统操作提示'),
            bigCategory : 'noticePage',
            infoType : infoType,
            infoContent : infoContent,
            area : '',
            layout: 'manage/public/adminTemp'
        }

    },

    setQueryByArea : function(req,keyPr,targetObj,area){
        var newKeyPr = keyPr;
        if(targetObj == UserNotify){
            if(area && area == 'systemNotice'){
                newKeyPr = {'systemUser' : req.session.adminUserInfo._id };
            }
        }else if(targetObj == Notify){
            if(area && area == 'announce'){
                newKeyPr = {'type' : '1' };
            }
        }
        return newKeyPr;
    },

    getAdminNotices : function (req,res,callBack) {

        UserNotify.find({'systemUser':req.session.adminUserInfo._id,'isRead':false})
            .populate('user').populate('notify').exec(function(err,docs){
            if(err){
                res.end(err);
            }else{
                var regNoticeArr = [];
                var msgNoticeArr = [];
                if(docs.length >0){
                    for(var i=0;i<docs.length;i++){
                        var item = docs[i];
                        if(item.notify && item.notify.action == 'reg'){
                            regNoticeArr.push(item)
                        }else if(item.notify && item.notify.action == 'msg'){
                            msgNoticeArr.push(item)
                        }
                    }
                };
                var noticeObj = {
                    regNotices : regNoticeArr,
                    msgNotices : msgNoticeArr,
                    totalCount : regNoticeArr.length + msgNoticeArr.length
                };
                callBack(noticeObj);
            }
        });

    },

    delNotifiesById : function(req,res,nid,callBack){
        if(shortid.isValid(nid)){
            Notify.delOneNotify(res,nid,function(){
                var notifyQuery = {'notify': { $regex: new RegExp(nid, 'i') }};
                UserNotify.remove(notifyQuery,function(err){
                    if(err){
                        res.end(err);
                    }else{
                        callBack();
                    }
                });
            });
        }else{
            res.end(settings.system_illegal_param);
        }

    },

    getTargetObj : function(currentPage){
        var targetObj;
        if(currentPage === settings.adminUsersList[0] ){
            targetObj = AdminUser;
        }else if(currentPage === settings.adminGroupList[0] ){
            targetObj = AdminGroup;
        }else if(currentPage === settings.adsList[0] ){
            targetObj = Ads;
        }else if(currentPage === settings.filesList[0] ){
            targetObj = Files;
        }else if(currentPage === settings.backUpData[0] ){
            targetObj = DataOptionLog;
        }else if(currentPage === settings.systemLogs[0] ){
            targetObj = SystemOptionLog;
        }else if(currentPage === settings.contentList[0] ){
            targetObj = Content;
        }else if(currentPage === settings.contentCategorys[0] ){
            targetObj = ContentCategory;
        }else if(currentPage === settings.contentTags[0] ){
            targetObj = ContentTags;
        }else if(currentPage === settings.contentTemps[0] ){
            targetObj = ContentTemplate;
        }else if(currentPage === settings.CONTENTTEMPITEMS[0] ){
            targetObj = TemplateItems;
        }else if(currentPage === settings.messageList[0] ){
            targetObj = Message;
        }else if(currentPage === settings.regUsersList[0] ){
            targetObj = User;
        }else if(currentPage === settings.systemNotice[0] ){
            targetObj = Notify;
        }else if(currentPage === settings.userNotice[0] ){
            targetObj = UserNotify;
        }else if(currentPage === settings.sysTemBackStageNotice[0] ){
            targetObj = UserNotify;
        }else{
            targetObj = Content;
        }

        return targetObj
    },

    checkAdminPower : function(req,key){
        var power = false;
        var uPower = req.session.adminPower;
        if(uPower){
            var newPowers = eval(uPower);
            for(var i=0;i<newPowers.length;i++) {
                var checkedId = newPowers[i].split(':')[0];
                if(checkedId == key && newPowers[i].split(':')[1]){
                    power = true;
                    break;
                }
            }
        }
        return power;
    },

    renderToManagePage : function(req,res,url,pageKey){

        if(this.checkAdminPower(req,pageKey[0] + '_view')){
            res.render(url, this.setPageInfo(req,res,pageKey,'/admin/'+url));
        }else{
            res.render("manage/public/notice", this.setDataForInfo('danger','对不起，您无权操作 <strong>'+pageKey[1]+'</strong> 模块！'));
        }
    },

    checkTempInfo : function(tempInfoData,forderName,callBack){

        var name = tempInfoData.name;
        var alias = tempInfoData.alias;
        var version = tempInfoData.version;
        var sImg = tempInfoData.sImg;
        var author = tempInfoData.author;
        var comment = tempInfoData.comment;
        var errors;

        if(forderName !== alias){
            errors = '模板名称跟文件夹名称不统一';
        }

        if(!validator.isLength(name,4,15)){
            errors = '模板名称必须为4-15个字符';
        }

        if(!validator.isEn(alias)){
            errors = '模板关键字必须为英文字符';
        }

        if(!validator.isLength(alias,4,15)){
            errors = '模板关键字必须为4-15个字符';
        }

        if(!validator.isLength(version,2,15)){
            errors = '版本号必须为2-15个字符';
        }

        if(!validator.isLength(author,4,15)){
            errors = '作者名称必须为4-15个字符';
        }

        if(!validator.isLength(comment,4,40)){
            errors = '模板描述必须为4-30个字符';
        }

        if(errors){
            callBack(errors);
        }else{
            var query=ContentTemplate.find().or([{'name' : name},{alias : alias}]);
            query.exec(function(err,temp){
                if(err){
                    res.end(err);
                }else{
                    if(temp.length > 0){
                        errors = "模板名称或key已存在，请修改后重试！";
                    }else{
                        errors = 'success';
                    }
                    callBack(errors);
                }

            });
        }
    },

    getTempBaseFile : function(path){
        var thisType = (path).split('.')[1];
        var basePath;
        if(thisType == 'ejs'){
            basePath = settings.SYSTEMTEMPFORDER;
        }else{
            basePath = settings.TEMPSTATICFOLDER;
        }
        return basePath;
    },

    authDoraCMS : function(req,res,callBack){
        var params = {
          domain : req.headers.host,
          ipAddress : adminFunc.getClienIp(req)
        };
        if(req.session.adminUserInfo && !req.session.adminUserInfo.auth){
            request.post({url: settings.DORACMSAPI + '/system/checkSystemInfo', form: params}, function(err,httpResponse,body){
                if (!err && httpResponse.statusCode == 200) {
                    if(body == 'success'){
                        AdminUser.update({'_id':req.session.adminUserInfo._id},{$set : {auth : true}},function(err){
                            if(err){
                                console.log(err);
                            }
                            callBack();
                        })
                    }
                }else{
                    callBack();
                }
            })
        }else{
            callBack();
        }
    },

    setTempParentId : function(arr,key){
        for(var i=0;i<arr.length;i++){
            var pathObj = arr[i];
            pathObj.pId = key;
        }
        return arr;
    },

    delRefObjById : function(res,obj,refObj,targetId,callBack){
        obj.findOne({'_id':targetId},function(err,doc){
            if(err){
                res.end(err);
            }else{
                if(doc){
                    var items = doc.items;
                    refObj.remove({'_id':{$in: items}},function(err1){
                        if(err1){
                            res.end(err1);
                        }else{
                            obj.remove({'_id':targetId},function(err2){
                                if(err2){
                                    res.end(err2);
                                }else{
                                    callBack(doc);
                                }
                            })
                        }
                    });
                }else{
                    res.end(settings.system_illegal_param);
                }
            }
        })
    },

    delSonRefObjById : function(res,obj,refObj,targetId,refObjId,callBack){
        obj.findOne({'_id' : targetId},function(err,doc){
            if(doc){
                refObj.remove({_id : refObjId},function(err){
                    if(err){
                        res.end(err);
                    }else{
                        var items = doc.items;
                        for(var i=0;i<items.length;i++){
                            if(items[i] == refObjId){
                                items.splice(i,1);
                                break;
                            }
                        }
                        doc.items = items;
                        doc.save(function(err1){
                            if(err1){
                                res.end(err1);
                            }
                            callBack();
                        });
                    }
                })
            }else{
                res.end(settings.system_illegal_param);
            }
        })
    }


};


module.exports = adminFunc;