const jwt = require('jsonwebtoken');
let settings = require('@configs/settings');

var token = {

    checkToken: function (token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, settings.encrypt_key, function (err, decoded) {
                if (err) {
                    console.log('check token failed', err);
                    if (err.message == "jwt expired") {
                        resolve('0'); // 超时
                    } else {
                        resolve('-1'); // token非法
                    }
                } else {
                    // console.log('---decoded---', decoded)
                    resolve(decoded);
                }
            });
        })
    }

}
module.exports = token;