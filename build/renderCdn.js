
var fs = require('fs');
var settings = require('../configs/settings');
var manageHtmlPath = './dist/admin.html'
var cdnPath = settings.origin;
var checkMe = function () {
    return new Promise((resolve, reject) => {
        fs.exists(manageHtmlPath, function (exists) {
            if (exists) {
                resolve(1);
            } else {
                checkMe();
            }
        })
    })
};

if (settings.openqn && settings.assetsCdn) {
    checkMe().then((data) => {
        if (data == 1) {
            var adminText = fs.readFileSync(manageHtmlPath, 'utf-8');
            var newAdminContent = adminText.replace(/\/static\/js\/element/, cdnPath + '/element');
            fs.writeFileSync(manageHtmlPath, newAdminContent);
        }
    })
}
