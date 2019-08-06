const validator = require('validator');
function validateEmail(email) {
    // console.log('----email',email && validator.isEmail(email)
    // && email.length < 100);
    return email && validator.isEmail(email)
        && email.length < 100
}

function validateName(loginname) {
    return loginname && loginname.length > 2 && loginname.length < 25
}

function validatePassword(pwd) {
    return pwd.length < 100 & pwd.length > 6;
}



module.exports = {
    validateEmail,
    validateName,
    validatePassword
}