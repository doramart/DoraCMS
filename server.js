const isProd = process.env.NODE_ENV === 'production'
// 标签渲染初始化开始
require('./server/bootstrap/index');
// 标签渲染初始化结束
const fs = require('fs')
const path = require('path')
const favicon = require('serve-favicon')
const i18n = require('i18n');
const express = require('express')
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const RedisStore = require('connect-redis')(session);
const compression = require('compression')
const ueditor = require("ueditor")
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const _ = require('lodash')
const resolve = file => path.resolve(__dirname, file)
const settings = require('@configs/settings');
const {
    siteFunc,
    logUtil
} = require('@utils');
const {
    // WEB_MIDDLEWARE_BEGIN
    authPath,
    authUserToken,
    // WEB_MIDDLEWARE_END
    // BACKSTATE_MIDDLEWARE_BEGIN
    authAdminPageToken,
    // BACKSTATE_MIDDLEWARE_END
    // API_MIDDLEWARE_BEGIN
    nodeTask,
    crossHeader,
    authAdminToken,
    authAdminPower,
    // API_MIDDLEWARE_END
    nunjucksFilter,
    internationalization,
} = require('@middleware')


// API_ROUTER_BEGIN
const restApi = require('./server/routers/api');
const uploadApi = require('./server/routers/uploadFile');
// API_ROUTER_END

// WEB_ROUTER_BEGIN
const foreground = require('./server/routers/foreground');
const users = require('./server/routers/users');
// WEB_ROUTER_END

// BACKSTATE_ROUTER_BEGIN
const manage = require('./server/routers/manage');
// BACKSTATE_ROUTER_END

const app = express()

// BACKSTATE_HOT_PUBLISH_BEGIN
let backend, justServer;
if (!isProd) {
    require('./build/setup-dev-server')(app, (_template) => {
        backend = _template.backend;
        justServer = _template.justServer;
    })
}
// BACKSTATE_HOT_PUBLISH_END

// 设置静态文件缓存时间
const serve = (path, cache) => express.static(resolve(path), {
    maxAge: cache && isProd ? 60 * 60 * 24 * 30 : 0
})

// NUNJUCKS_IMPORT_BEGIN
nunjucksFilter(app);
// NUNJUCKS_IMPORT_END

// NODE_TASK_BEGIN
nodeTask();
// NODE_TASK_END

app.set('view engine', 'html');

// SITE_FAVICON_BEGIN
app.use(favicon('./favicon.ico'))
// SITE_FAVICON_END

app.use(compression({
    threshold: 0
}))
// 日志
app.use(logger('":method :url" :status :res[content-length] ":referrer" ":user-agent"'))

// body 解析中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

// cookie 解析中间件
app.use(cookieParser(settings.session_secret));

// session配置
let sessionConfig = {};
console.log('Redis状态开关：', settings.openRedis);
if (settings.openRedis) {
    sessionConfig = {
        secret: settings.session_secret,
        store: new RedisStore({
            port: settings.redis_port,
            host: settings.redis_host,
            pass: settings.redis_psd,
            ttl: 60 * 60 * settings.redis_ttl
        }),
        resave: true,
        saveUninitialized: true
    }
} else {
    sessionConfig = {
        secret: settings.encrypt_key,
        cookie: {
            maxAge: 1000 * 60 * 60 * settings.redis_ttl
        },
        resave: false,
        saveUninitialized: true,
        store: new MongoStore({
            db: "session",
            url: settings.mongo_connection_uri
        })
    }
}
app.use(session(sessionConfig));

//添加国际化配置中间件，注意必须在配置session之后
app.use((req, res, next) => {
    i18n.configure({
        locales: settings.languages, //声明包含的语言
        directory: __dirname + '/server/locales', //翻译json文件的路径
        defaultLocale: settings.lang, //默认的语言，即为上述标准4
        objectNotation: true,
        indent: "\t"
    });
    next();
});

//国际化初始化
app.use(i18n.init);

// WEB_AUTHUSER_BEGIN
app.use(authUserToken);
// WEB_AUTHUSER_END

// 初始化日志目录开始
logUtil.initPath();
// 初始化日志目录结束

// 设置 express 根目录开始
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin/static', serve('./admin/static', true))
app.use('/admin/service-worker.js', serve('./admin/service-worker.js'))
// 设置 express 根目录结束

// 国际化开始
app.use(internationalization);
// 国际化结束

// WEB_API_ENTRANCE_BEGIN
app.use('/', authPath, foreground);
app.use('/users', users);
// WEB_API_ENTRANCE_END

// API_ENTRANCE_BEGIN
app.use('/api/v0', crossHeader, restApi);
app.use('/api/v0/upload', crossHeader, uploadApi);
// API_ENTRANCE_END


// WEB_ROBOTS_BEGIN
app.get('/robots.txt', function (req, res, next) {
    let stream = fs.createReadStream(path.join(__dirname, './robots.txt'), {
        flags: 'r'
    });
    stream.pipe(res);
});
// WEB_ROBOTS_END

// UEDITOR_IMPORT_BEGIN
let qnParams = settings.openqn ? {
    qn: {
        accessKey: settings.accessKey,
        secretKey: settings.secretKey,
        bucket: settings.bucket,
        origin: settings.origin
    },
    local: true
} : {};
app.use("/ueditor/ue", ueditor(path.join(__dirname, 'public'), config = qnParams, function (req, res, next) {
    var imgDir = '/upload/images/ueditor/' //默认上传地址为图片
    var actionType = req.query.action;
    if (actionType === 'uploadimage' || actionType === 'uploadfile' || actionType === 'uploadvideo') {
        var file_url = imgDir; //默认上传地址为图片
        /*其他上传格式的地址*/
        if (actionType === 'uploadfile') {
            file_url = '/upload/file/ueditor/'; //附件保存地址
        }
        if (actionType === 'uploadvideo') {
            file_url = '/upload/video/ueditor/'; //视频保存地址
        }
        res.ue_up(file_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
        res.setHeader('Content-Type', 'text/html');
    }
    //客户端发起图片列表请求
    else if (actionType === 'listimage') {
        res.ue_list(imgDir); // 客户端会列出 dir_url 目录下的所有图片
    }
    // 客户端发起其它请求
    else {
        res.setHeader('Content-Type', 'application/json');
        res.redirect('/ueditor/ueditor.config.json')
    }
}));
// UEDITOR_IMPORT_END

// BACKSTATE_ADMIN_LOGIN_BEGIN
app.get(
    "/dr-admin",
    async (req, res, next) => {
        if (req.session.adminlogined) {
            res.redirect("/manage");
        } else {
            try {
                let configs = await reqJsonData('systemConfig/getConfig');
                let localKeys = await siteFunc.getSiteLocalKeys(req.session.locale, res);
                let lsk = JSON.stringify(localKeys.sysKeys);
                res.render(process.cwd() + '/views/' + 'adminUserLogin.html', {
                    pageType: 'adminlogin',
                    lk: localKeys.renderKeys,
                    lsk,
                    configs
                })
            } catch (error) {
                logUtil.error(error, req);
            }
        }
    }
);
// BACKSTATE_ADMIN_LOGIN_END

// BACKSTATE_PAGE_RENDER_BEGIN
app.get('/manage', authAdminPageToken, (req, res, next) => {

    if (!_.isEmpty(req.session.adminUserInfo)) {
        next();
    } else {
        res.redirect('/dr-admin');
    }

}, async (req, res) => {
    let manageCates = req.session.manageCates
    let adminPower = req.session.adminPower;
    let currentCates = JSON.stringify(siteFunc.renderNoPowerMenus(manageCates, adminPower));
    if (isProd) {
        res.render(process.cwd() + '/views/' + 'admin.html', {
            title: 'DoraCMS后台管理系统',
            manageCates: currentCates
        })
    } else {
        if (justServer) {
            backend = backend.replace('{{manageCates}}', currentCates);
        } else {
            backend = backend.replace(/\[[^\]]+\]/g, currentCates)
        }
        res.send(backend)
    }
});
// BACKSTATE_PAGE_RENDER_END

// BACKSTATE_API_ENTRANCE_BEGIN
app.use('/manage', authAdminToken, authAdminPower, manage);
// BACKSTATE_API_ENTRANCE_END

// 404 页面
app.get('*', (req, res) => {
    let Page404 = `
        <div style="text-align:center">
            <h3 style="width: 25%;font-size: 12rem;color: #409eff;margin: 0 auto;margin-top: 10%;">404</h3>
            <div style="font-size: 15px;color: #878d99;">${res.__("label_page_404")} &nbsp;<a href="/">${res.__("label_backto_index")}</a></div>
        </div>
    `
    res.send(Page404)
})

app.use(function (req, res, next) {
    var err = new Error(req.originalUrl + ' Not Found')
    err.status = 404
    next(err)
})

app.use(function (err, req, res) {
    if (err) logUtil.error(err, req);
    res.status(err.status || 500)
    res.send(err.message)
})

const port = process.env.PORT || settings.serverPort
let dserver = app.listen(port, () => {
    console.log(`server started at localhost:${port}`)
})

const io = require('socket.io')(dserver);

app.set('socketio', io);