const ueditor = require('egg-ueditor')


module.exports = app => {

    app.all('/ueditor', ueditor([app.config.upload_path, 'static']));
    require('./router/api')(app);
    // FRONT_ROUTER_BEGIN
    require('./router/home')(app);
    require('./router/users')(app);
    // FRONT_ROUTER_END
    require('./router/manage')(app);

};