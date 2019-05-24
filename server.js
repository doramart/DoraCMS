process.env.VUE_ENV = 'server'
const isProd = process.env.NODE_ENV === 'production'
global.NODE_ENV = isProd

const fs = require('fs')
const path = require('path')
const url = require("url");
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
const nunjucks = require('nunjucks')
const _ = require('lodash')
const resolve = file => path.resolve(__dirname, file)

const settings = require('./configs/settings');
const {
    service,
    authSession,
    siteFunc
} = require('./utils');
const authUser = require('./utils/middleware/authUser');
const logUtil = require('./utils/middleware/logUtil');
const nunjucksFilter = require('./utils/middleware/nunjucksFilter');
const authPath = require('./utils/middleware/authPath');
const addTask = require('./utils/middleware/task');
const {
    AdminResource
} = require('./server/lib/controller');



// api路由开始
const restApi = require('./server/routers/restApi/v0');
const uploadApi = require('./server/routers/restApi/uploadFile');
// api路由结束

// 前端路由开始
const foreground = require('./server/routers/foreground');
const users = require('./server/routers/users');
const manage = require('./server/routers/manage');
const system = require('./server/routers/system');
// 前端路由结束

const app = express()

// 定义setLocale中间件
let languages = settings.languages;

function setLocale(req, res, next) {
    //配置i18n
    i18n.configure({
        locales: languages, //声明包含的语言
        // register: res,
        directory: __dirname + '/locales', //翻译json文件的路径
        defaultLocale: settings.lang, //默认的语言，即为上述标准4
        objectNotation: true,
        indent: "\t"
    });
    next();
};



// 由 html-webpack-plugin 生成
let backend;
if (!isProd) {
    require('./build/setup-dev-server')(app, (_template) => {
        backend = _template.backend
    })
}

// 设置静态文件缓存时间
const serve = (path, cache) => express.static(resolve(path), {
    maxAge: cache && isProd ? 60 * 60 * 24 * 30 : 0
})

// 引用 nunjucks 模板引擎开始
let env = nunjucks.configure(path.join(__dirname, 'views'), { // 设置模板文件的目录，为views
    noCache: process.env.NODE_ENV !== 'production',
    autoescape: true,
    express: app
});
// 引用 nunjucks 模板引擎结束

// 初始化定时任务
addTask();

app.set('view engine', 'html');

app.use(favicon('./favicon.ico'))
app.use(compression({
    threshold: 0
}))
// 日志
app.use(logger('":method :url" :status :res[content-length] ":referrer" ":user-agent"'))
// body 解析中间件
app.use(bodyParser.urlencoded({
    extended: true
}))
// cookie 解析中间件
app.use(cookieParser(settings.session_secret));
// session配置
let sessionConfig = {
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

app.use(session(sessionConfig));
//添加setLocale中间件，注意必须在配置session之后
app.use(setLocale);
//国际化初始化
app.use(i18n.init);

// 鉴权用户开始
app.use(authUser.auth);
// 鉴权用户结束

// 初始化日志目录开始
logUtil.initPath();
// 初始化日志目录结束

// 设置 express 根目录开始
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')))
app.use('/server', serve('./dist/server', true))
app.use('/static', serve('./dist/static', true))
app.use('/manifest.json', serve('./manifest.json'))
app.use('/service-worker.js', serve('./dist/service-worker.js'))
// 设置 express 根目录结束

// 国际化开始
app.use(function (req, res, next) {

    let targetLanguage = url.parse(req.originalUrl).pathname;
    let reqParams = req.query;
    // 针对移动端
    if (reqParams.token && reqParams.lang) {
        let currentLang = reqParams.lang;
        if ((settings.languages).indexOf(currentLang) < 0) {
            currentLang = 'zh-CN';
        }
        i18n.setLocale(req, currentLang);
        next();
    } else { // web端
        if (targetLanguage) {
            let languageStr = targetLanguage.split('/')[1];
            // 访问首页
            if (languageStr == '') {
                // 自己以前切换过
                if (req.session.locale) {
                    res.redirect('/' + req.session.locale);
                } else { // 第一次访问
                    // 获取浏览器语言
                    let browserLanguage = req.headers["accept-language"];
                    if (browserLanguage) {
                        let currentLanguage = browserLanguage.split(',')[0];
                        if (currentLanguage.indexOf(settings.languages) >= 0) {
                            req.session.locale = currentLanguage;
                            res.redirect('/' + currentLanguage);
                        } else {
                            req.session.locale = 'zh-CN';
                        }
                    } else {
                        req.session.locale = 'zh-CN';
                    }
                    i18n.setLocale(req, req.session.locale);
                    nunjucksFilter(env, req.session.locale);
                    next();
                }
            } else { // 从别的页面进来的
                if (languageStr == 'zh-CN') {
                    req.session.locale = 'zh-CN';
                } else if (languageStr == 'zh-TW') {
                    req.session.locale = 'zh-TW';
                } else {
                    if (!req.session.locale) {
                        let browserLanguage = req.headers["accept-language"];
                        if (browserLanguage) {
                            let currentLanguage = browserLanguage.split(',')[0];
                            if (currentLanguage.indexOf(settings.languages) >= 0) {
                                req.session.locale = currentLanguage;
                            } else {
                                req.session.locale = 'zh-CN';
                            }
                        } else {
                            req.session.locale = 'zh-CN';
                        }
                    }
                }
                if (req.session.locale) {
                    i18n.setLocale(req, req.session.locale);
                }
                // nunjucks过滤器
                nunjucksFilter(env, req.session.locale);
                next();
            }

        } else {
            // nunjucks过滤器
            nunjucksFilter(env, req.session.locale);
            next();
        }
    }

});
// 国际化结束

// 入口路由开始
app.use('/', authPath, foreground);
// 入口路由结束

// api入口开始
app.use('/api/v0', siteFunc.setUserClient, restApi);
app.use('/api/v0/upload', siteFunc.setUserClient, uploadApi);
// api入口结束



// 前端路由入口开始
app.use('/users', users);
app.use('/system', system);

// 机器人抓取
app.get('/robots.txt', function (req, res, next) {
    let stream = fs.createReadStream(path.join(__dirname, './robots.txt'), {
        flags: 'r'
    });
    stream.pipe(res);
});

// 集成ueditor
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
    var ActionType = req.query.action;
    if (ActionType === 'uploadimage' || ActionType === 'uploadfile' || ActionType === 'uploadvideo') {
        var file_url = imgDir; //默认上传地址为图片
        /*其他上传格式的地址*/
        if (ActionType === 'uploadfile') {
            file_url = '/upload/file/ueditor/'; //附件保存地址
        }
        if (ActionType === 'uploadvideo') {
            file_url = '/upload/video/ueditor/'; //视频保存地址
        }
        res.ue_up(file_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
        res.setHeader('Content-Type', 'text/html');
    }
    //客户端发起图片列表请求
    else if (ActionType === 'listimage') {
        res.ue_list(imgDir); // 客户端会列出 dir_url 目录下的所有图片
    }
    // 客户端发起其它请求
    else {
        res.setHeader('Content-Type', 'application/json');
        res.redirect('/ueditor/ueditor.config.json')
    }
}));


// 后台渲染开始
app.get('/manage', authSession, function (req, res) {
    AdminResource.getAllResource(req, res).then((manageCates) => {
        let adminPower = req.session.adminPower;
        // console.log('adminPower', adminPower);
        let currentCates = JSON.stringify(siteFunc.renderNoPowerMenus(manageCates, adminPower));
        if (isProd) {
            res.render(process.cwd() + '/views/' + 'admin.html', {
                title: 'DoraCMS后台管理系统',
                manageCates: currentCates
            })
        } else {
            backend = backend.replace(/\[[^\]]+\]/g, currentCates)
            res.send(backend)
        }
    })
});
app.use('/manage', (req, res, next) => {
    req.query.useClient = '0';
    console.log('requset from manager');
    next()
}, manage);
// 后台渲染结束

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