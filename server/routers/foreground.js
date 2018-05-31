const express = require("express");
const router = express.Router();
router.strict = true;
router.caseSensitive = true;
const fs = require("fs");
const path = require("path");
const { authSession } = require("../../utils");
const generalFun = require("../lib/utils/generalFun");
const { ContentCategory, Content, SystemConfig } = require("../lib/controller");
const moment = require("moment");
const shortid = require("shortid");
const validator = require("validator");
var schedule = require("node-schedule");
let markTimer;

//配置站点地图和robots抓取
router.get("/sitemap.xml", (req, res, next) => {
  SystemConfig.getConfigsByFiles("siteDomain")
    .then(result => {
      let root_path = result[0].siteDomain;
      let priority = 0.8;
      let freq = "weekly";
      let lastMod = moment().format("YYYY-MM-DD");
      let xml =
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
      xml += "<url>";
      xml += "<loc>" + root_path + "</loc>";
      xml += "<changefreq>daily</changefreq>";
      xml += "<lastmod>" + lastMod + "</lastmod>";
      xml += "<priority>" + 1 + "</priority>";
      xml += "</url>";

      req.query.catefiles = "defaultUrl";
      req.query.contentfiles = "title";
      ContentCategory.getAllCategories(req, res)
        .then(cates => {
          cates.forEach(function (cate) {
            xml += "<url>";
            xml +=
              "<loc>" +
              root_path +
              "/" +
              cate.defaultUrl +
              "___" +
              cate._id +
              "</loc>";
            xml += "<changefreq>weekly</changefreq>";
            xml += "<lastmod>" + lastMod + "</lastmod>";
            xml += "<priority>0.8</priority>";
            xml += "</url>";
          });
          return Content.getAllContens(req, res);
        })
        .then(contentLists => {
          contentLists.forEach(function (post) {
            xml += "<url>";
            xml += "<loc>" + root_path + "/details/" + post._id + ".html</loc>";
            xml += "<changefreq>weekly</changefreq>";
            xml += "<lastmod>" + lastMod + "</lastmod>";
            xml += "<priority>0.5</priority>";
            xml += "</url>";
          });
          xml += "</urlset>";
          res.end(xml);
        })
        .catch(err => {
          res.send({
            status: 500,
            message: err.message
          });
        });
    })
    .catch(err => {
      console.log("请先配置站点域名:", err);
    });
});

router.get("/sitemap.html", generalFun.getDataForSiteMap);

router.get(
  "/",
  (req, res, next) => {
    next();
  },
  generalFun.getDataForIndexPage
);

router.get(
  "/page/:current.html",
  (req, res, next) => {
    req.query.current = req.params.current;
    next();
  },
  generalFun.getDataForIndexPage
);

// 内容详情入口
router.get(
  "/details/:id.html",
  (req, res, next) => {
    let contentId = req.params.id;
    if (contentId) {
      if (!shortid.isValid(contentId)) {
        res.redirect("/");
      } else {
        req.query.id = contentId;
        next();
      }
    } else {
      res.redirect("/");
    }
  },
  generalFun.getDataForContentDetails
);

// 类别入口
router.get(
  [
    "/:cate1?___:typeId?",
    "/:cate1?___:typeId?/:current.html?",
    "/:cate0/:cate1?___:typeId?",
    "/:cate0/:cate1?___:typeId?/:current.html?"
  ],
  (req, res, next) => {
    let typeId = req.params.typeId;
    let cate1 = req.params.cate1;
    let current = req.params.current;
    if (typeId) {
      if (!shortid.isValid(typeId)) {
        res.redirect("/");
      } else {
        req.query.typeId = typeId;
        if (current) {
          if (validator.isNumeric(current)) {
            req.query.current = current;
            next();
          } else {
            res.redirect("/");
          }
        } else {
          next();
        }
      }
    } else {
      res.redirect("/");
    }
  },
  generalFun.getDataForCatePage
);

router.get(
  ["/search/:searchkey", "/search/:searchkey/:current.html"],
  (req, res, next) => {
    let searchkey = req.params.searchkey;
    let current = req.params.current;
    if (searchkey) {
      req.query.searchkey = searchkey;
      if (current) {
        if (validator.isNumeric(current)) {
          req.query.current = current;
          next();
        } else {
          res.redirect("/");
        }
      } else {
        next();
      }
    } else {
      res.redirect("/");
    }
  },
  generalFun.getDataForCatePage
);

router.get(
  ["/tag/:tagName", "/tag/:tagName/:current.html"],
  (req, res, next) => {
    let tagName = req.params.tagName;
    let current = req.params.current;
    if (tagName) {
      req.query.tagName = tagName;
      if (current) {
        if (validator.isNumeric(current)) {
          req.query.current = current;
          next();
        } else {
          res.redirect("/");
        }
      } else {
        next();
      }
    } else {
      res.redirect("/");
    }
  },
  generalFun.getDataForCatePage
);

// 管理员登录
router.get(
  "/dr-admin",
  (req, res, next) => {
    if (req.session.adminlogined) {
      res.redirect("/manage");
    } else {
      next();
    }
  },
  generalFun.getDataForAdminUserLogin
);
module.exports = router;
