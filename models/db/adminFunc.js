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

var adminFunc = {

    siteInfos : function (description) {

        return {
            title : settings.SITETITLE,
            description : description
        }
    },

    getMessageList : function(){
        return Message.find({}).limit(5).sort({'date' : -1});
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
            msgList : this.getMessageList()
        })
    },

    setPageInfo : function(req,res,module,currentLink){

        var searchKey = '';

        if(req.url){
            var params = url.parse(req.url,true);
            searchKey = params.query.searchKey;
        }

        return {
            siteInfo : this.siteInfos(module[1]),
            bigCategory : module[0],
            searchKey : searchKey,
            currentLink : currentLink,
            layout : 'manage/public/adminTemp'
        }

    },

    setDataForInfo : function(infoType,infoContent){

        return {
            siteInfo : this.siteInfos('系统操作提示'),
            bigCategory : 'noticePage',
            infoType : infoType,
            infoContent : infoContent,
            layout: 'manage/public/adminTemp'
        }

    },

    getTargetObj : function(currentPage){
        var targetObj;
        if(currentPage.indexOf(settings.ADMINUSERLIST[0]) >=0 ){
            targetObj = AdminUser;
        }else if(currentPage.indexOf(settings.ADMINGROUPLIST[0]) >=0 ){
            targetObj = AdminGroup;
        }else if(currentPage.indexOf(settings.ADSLIST[0]) >=0 ){
            targetObj = Ads;
        }else if(currentPage.indexOf(settings.FILESLIST[0]) >=0 ){
            targetObj = Files;
        }else if(currentPage.indexOf(settings.BACKUPDATA[0]) >=0 ){
            targetObj = DataOptionLog;
        }else if(currentPage.indexOf(settings.SYSTEMLOGS[0]) >=0 ){
            targetObj = SystemOptionLog;
        }else if(currentPage.indexOf(settings.CONTENTLIST[0]) >=0 ){
            targetObj = Content;
        }else if(currentPage.indexOf(settings.CONTENTCATEGORYS[0]) >=0 ){
            targetObj = ContentCategory;
        }else if(currentPage.indexOf(settings.CONTENTTAGS[0]) >=0 ){
            targetObj = ContentTags;
        }else if(currentPage.indexOf(settings.CONTENTTEMPS[0]) >=0 ){
            targetObj = ContentTemplate;
        }else if(currentPage.indexOf(settings.MESSAGEMANAGE[0]) >=0 ){
            targetObj = Message;
        }else if(currentPage.indexOf(settings.REGUSERSLIST[0]) >=0 ){
            targetObj = User;
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
//                console.log('------checkedId-------'+checkedId+'-----key------'+key);
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
    }


};


module.exports = adminFunc;