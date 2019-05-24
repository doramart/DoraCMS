var fs = require('fs');
var settings = require('../configs/settings');
var apiDocHtmlPath = './public/apidoc/api_data.json'
let apiDocPathArr = ['./public/apidoc/api_data.json', './public/apidoc/api_data.js', './public/apidoc/api_project.json', './public/apidoc/api_project.js', './public/shopApidoc/api_data.json', './public/shopApidoc/api_data.js', './public/shopApidoc/api_project.json', './public/shopApidoc/api_project.js'];
let docState = "dev"; //  dev 或 prd 可选
require('shelljs/global')
let argvs = process.argv;
// console.log('----argvs[0]---', argvs);
if (argvs[2] == '--docv') {
    docState = argvs[3];
}
// console.log('--docState---', docState)
if (docState == 'prd') {
    for (const targetPath of apiDocPathArr) {
        if (fs.existsSync(targetPath)) {
            let apiDocHtmlText = fs.readFileSync(targetPath, 'utf-8');
            var reg = new RegExp('localhost:8080', "g")
            var newApiHtmlText = apiDocHtmlText.replace(reg, 'www.html-js.cn');
            fs.writeFileSync(targetPath, newApiHtmlText);
        }
    }
    cp('-R', './public/themes/dorawhite/js/main.js', './public/apidoc/')
}