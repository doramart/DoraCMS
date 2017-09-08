const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { authSession, settings } = require('../../utils');
const { ContentCategory, Content } = require('../lib/controller');
const moment = require('moment');


//配置站点地图和robots抓取
router.get('/sitemap.xml', (req, res, next) => {
  let root_path = 'https://www.html-js.cn';
  let priority = 0.8;
  let freq = 'weekly';
  let lastMod = moment().format('YYYY-MM-DD');
  let xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  xml += '<url>';
  xml += '<loc>' + root_path + '</loc>';
  xml += '<changefreq>daily</changefreq>';
  xml += '<lastmod>' + lastMod + '</lastmod>';
  xml += '<priority>' + 1 + '</priority>';
  xml += '</url>';

  req.query.catefiles = 'defaultUrl';
  req.query.contentfiles = 'title';
  ContentCategory.getAllCategories(req, res).then((cates) => {
    cates.forEach(function (cate) {
      xml += '<url>';
      xml += '<loc>' + root_path + '/' + cate.defaultUrl + '___' + cate._id + '</loc>';
      xml += '<changefreq>weekly</changefreq>';
      xml += '<lastmod>' + lastMod + '</lastmod>';
      xml += '<priority>0.8</priority>';
      xml += '</url>';
    });
    return Content.getAllContens(req, res);
  }).then((contentLists) => {
    contentLists.forEach(function (post) {
      xml += '<url>';
      xml += '<loc>' + root_path + '/details/' + post._id + '.html</loc>';
      xml += '<changefreq>weekly</changefreq>';
      xml += '<lastmod>' + lastMod + '</lastmod>';
      xml += '<priority>0.5</priority>';
      xml += '</url>';
    });
    xml += '</urlset>';
    res.end(xml);
  }).catch((err) => {
    res.send({
      state: 'error',
      err
    })
  });
})

// router.get('/robots.txt', function (req, res, next) {
//   let stream = fs.createReadStream(path.join(__dirname, '../../robots.txt'), {
//     flags: 'r'
//   });
//   stream.pipe(res);
// });


module.exports = router