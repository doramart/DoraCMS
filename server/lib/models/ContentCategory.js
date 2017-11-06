/**
 * Created by Administrator on 2015/4/15.
 * 文章类别对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var ContentCategorySchema = new Schema({
    _id: {
        type: String,
        
        'default': shortid.generate
    },
    uid: {
        type: Number,
        default: 0
    },
    name: String,
    keywords: String,
    sortId: {
        type: Number,
        default: 1
    }, // 排序 正整数
    parentId: {
        type: String,
        default: "0"
    },
    enable: {
        type: Boolean,
        default: true
    }, //是否公开 默认公开
    date: {
        type: Date,
        default: Date.now
    },
    defaultUrl: {
        type: String,
        default: ""
    }, // seo link
    homePage: {
        type: String,
        default: "ui"
    }, // 必须唯一
    sortPath: {
        type: String,
        default: "0"
    }, //存储所有父节点结构
    comments: String
});


ContentCategorySchema.statics = {

    //更新大类模板，子类模板同步更新
    updateCategoryTemps: function (req, res, cateId) {
        if (shortid.isValid(cateId)) {
            var cateQuery = {
                'sortPath': {
                    $regex: new RegExp(cateId, 'i')
                }
            };
            ContentCategory.update(cateQuery, {
                $set: {
                    contentTemp: req.body.contentTemp
                }
            }, {
                multi: true
            }, function (err) {
                if (err) {
                    res.end(err);
                }
            })
        } else {
            res.end(settings.system_illegal_param);
        }
    },
    //根据Id查询类别信息
    getCateInfoById: function (cateId, callBack) {
        ContentCategory.findOne({
            "_id": cateId
        }).populate('contentTemp').exec(function (err, doc) {
            if (err) {
                res.end(err);
            } else {

                callBack(doc);
            }
        })
    }

};


var ContentCategory = mongoose.model("ContentCategory", ContentCategorySchema);

module.exports = ContentCategory;