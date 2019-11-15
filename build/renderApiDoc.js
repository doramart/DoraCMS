var fs = require('fs');
let apiDocPathArr = ['./app/public/apidoc/api_data.json', './app/public/apidoc/api_data.js', './app/public/apidoc/api_project.json', './app/public/apidoc/api_project.js'];
let docState = "dev"; //  dev 或 prd 可选
require('shelljs/global')
let argvs = process.argv;
if (argvs[2] == '--docv') {
    docState = argvs[3];
}
if (docState == 'prd') {
    for (const targetPath of apiDocPathArr) {
        if (fs.existsSync(targetPath)) {
            let apiDocHtmlText = fs.readFileSync(targetPath, 'utf-8');
            var reg = new RegExp('http://localhost:8080', "g")
            var newApiHtmlText = apiDocHtmlText.replace(reg, 'https://www.html-js.cn');
            fs.writeFileSync(targetPath, newApiHtmlText);
        }
    }
}