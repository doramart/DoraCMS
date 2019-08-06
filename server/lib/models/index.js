const mongoose = require('mongoose');
const settings = require('@configs/settings');
const fs = require('fs');
const path = require('path');
var modelsPath = path.resolve(__dirname, './');

mongoose.connect(settings.mongo_connection_uri, {
    useMongoClient: true
});

mongoose.Promise = global.Promise;
const db = mongoose.connection;

db.once('open', () => {
    console.log('connect mongodb success')
})

db.on('error', function (error) {
    console.error('Error in MongoDb connection: ' + error);
    mongoose.disconnect();
});

db.on('close', function () {
    console.log('数据库断开，重新连接数据库');
});


fs.readdirSync(modelsPath).forEach(function (name) {
    if (path.extname(name) !== '') {
        name = path.basename(name, '.js');
        if (name != 'index') {
            let currentName = name.substr(0, 1).toUpperCase() + name.slice(1);
            exports[currentName] = require(path.resolve(modelsPath, name));
        }
    }
});

//DoraModelEnd