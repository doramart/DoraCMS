'use strict';
const jwt = require('jsonwebtoken');

const token = {
  checkToken(token, encrypt_key) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, encrypt_key, function (err, decoded) {
        if (err) {
          console.log('check token failed', err);
          resolve(false);
        } else {
          // console.log('---decoded---', decoded)
          resolve(decoded);
        }
      });
    });
  },
};
module.exports = token;
