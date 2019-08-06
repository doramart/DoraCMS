const mongoose = require('mongoose');

module.exports = mongoose.model("UserRecorder", {
    id: String,
    loginname_map: Object,
    email_map: Object,
    nickname_map: Object
    
})