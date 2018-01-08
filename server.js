process.env.VUE_ENV = 'server'
const isProd = process.env.NODE_ENV === 'production'
global.NODE_ENV = isProd
const useMicroCache = process.env.MICRO_CACHE !== 'false'

const fs = require('fs')
const path = require('path')
const favicon = require('serve-favicon')
const express = require('express')
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const RedisStore = require('connect-redis')(session);
const compression = require('compression')
const lurCache = require('lru-cache')
const ueditor = require("ueditor")
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const { createBundleRenderer } = require('vue-server-renderer')
const _ = require('lodash')
const resolve = file => path.resolve(__dirname, file)

const serverInfo =
    `express/${require('express/package.json').version} ` +
    `vue-server-renderer/${require('vue-server-renderer/package.json').version}`

const { service, settings, authSession, logUtil, siteFunc } = require('./utils');
const authUser = require('./utils/middleware/authUser');
const { AdminResource } = require('./server/lib/controller');
// 引入 api 路由
const routes = require('./server/routers/api')
const foreground = require('./server/routers/foreground')
const manage = require('./server/routers/manage');
const system = require('./server/routers/system');

const isCacheable = () => useMicroCache
const microCache = lurCache({
    max: 100,
    maxAge: 1000
})

function createRenderer(bundle, template) {
    // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
    return createBundleRenderer(bundle, {
        template,

        // for component caching
        cache: lurCache({
            max: 1000,
            maxAge: 1000 * 60 * 15
        }),

        // this is only needed when vue-server-renderer is npm-linked
        basedir: resolve('./dist'),

        // recommended for performance
        runInNewContext: false
    })
}

const app = express()

// 由 html-webpack-plugin 生成
let frontend
let backend
// 创建来自 webpack 生成的服务端包
let renderer
if (isProd) {
    // 生产模式: 从 fs 创建服务器 HTML 渲染器和索引
    const bundle = require('./dist/vue-ssr-bundle.json')
    frontend = fs.readFileSync(resolve('./dist/server.html'), 'utf-8')
    renderer = createRenderer(bundle, frontend)
} else {
    // 开发模式: 设置带有热重新加载的 dev 服务器，并在文件更改时更新渲染器和索引 HTML
    require('./build/setup-dev-server')(app, (bundle, _template) => {
        frontend = _template.frontend
        backend = _template.backend
        renderer = createRenderer(bundle, frontend)
    })
}

// 设置静态文件缓存时间
const serve = (path, cache) => express.static(resolve(path), { maxAge: cache && isProd ? 60 * 60 * 24 * 30 : 0 })

// 引用 esj 模板引擎
app.set('views', path.join(__dirname, 'dist'))
app.engine('.html', require('ejs').__express)
app.set('view engine', 'ejs')

app.use(favicon('./favicon.ico'))
app.use(compression({ threshold: 0 }))
// 日志
app.use(logger('":method :url" :status :res[content-length] ":referrer" ":user-agent"'))
// body 解析中间件
// app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
// cookie 解析中间件
app.use(cookieParser(settings.session_secret));
// session配置
let sessionConfig = {};
if (settings.openRedis) {
    sessionConfig = {
        secret: settings.session_secret,
        store: new RedisStore({
            port: settings.redis_port,
            host: settings.redis_host,
            pass: settings.redis_psd,
            ttl: 1800 // 过期时间
        }),
        resave: true,
        saveUninitialized: true
    }
} else {
    sessionConfig = {
        secret: settings.encrypt_key,
        cookie: {
            maxAge: 1000 * 60 * 10
        },
        resave: false,
        saveUninitialized: true,
        store: new MongoStore({
            db: "session",
            host: "localhost",
            port: 27017,
            url: !isProd ? settings.URL : 'mongodb://' + settings.USERNAME + ':' + settings.PASSWORD + '@' + settings.HOST + ':' + settings.PORT + '/' + settings.DB + ''
        })
    }
}
app.use(session(sessionConfig));
// 鉴权用户
app.use(authUser.auth);
// 初始化日志目录
logUtil.initPath();
// 设置 express 根目录
app.use(express.static(path.join(__dirname, 'dist')))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/server', serve('./dist/server', true))
app.use('/static', serve('./dist/static', true))
app.use('/manifest.json', serve('./manifest.json'))
app.use('/service-worker.js', serve('./dist/service-worker.js'))
// api 路由
app.use('/', foreground);
app.use('/api', routes);
app.use('/system', system);

// 前台路由, ssr 渲染
app.get(['/', '/page/:current(\\d+)?', '/:cate1?___:typeId?/:current(\\d+)?',
    '/:cate0/:cate1?___:typeId?/:current(\\d+)?', '/search/:searchkey/:current(\\d+)?',
    '/details/:id', '/users/:userPage', '/users/editContent/:id', '/dr-admin', '/sitemap.html', '/tag/:tagName/:page(\\d+)?'], (req, res) => {

        // 非正常登录用户禁止访问
        if (req.originalUrl.indexOf('/users') == 0 && !req.session.logined) {
            return res.redirect('/');
        }

        if (req.originalUrl === '/dr-admin' && req.session.adminlogined) {
            return res.redirect('/manage');
        }

        if (!renderer) {
            return res.end('waiting for compilation... refresh in a moment.')
        }
        const s = Date.now()

        res.setHeader("Content-Type", "text/html")
        res.setHeader("Server", serverInfo)

        const errorHandler = err => {
            if (err && err.code === 404) {
                res.status(404).end('404 | Page Not Found')
            } else {
                // Render Error Page or Redirect
                res.status(500).end('Internal Error 500')
                console.error(`error during render : ${req.url}`)
                console.error(err)
            }
        }

        const cacheable = isCacheable(req)
        if (cacheable) {
            const hit = microCache.get(req.url)

            if (hit) {
                if (!isProd) {
                    console.log('cache hit!')
                }
                console.log(`whole request from cache: ${Date.now() - s}ms`)
                return res.end(hit);
            }
        }

        const context = {
            title: '前端开发俱乐部',
            description: '前端开发俱乐部',
            keywords: 'doracms',
            url: req.url,
            cookies: req.cookies,
            env: process.env.NODE_ENV
        }
        renderer.renderToString(context, (err, html) => {
            if (err) {
                return errorHandler(err)
            }
            res.end(html)
            if (cacheable) {
                microCache.set(req.url, html)
            }
            console.log(`whole request: ${Date.now() - s}ms`)
        })

    })

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


// 后台渲染
app.get('/manage', authSession, function (req, res) {
    AdminResource.getAllResource(req, res).then((manageCates) => {
        let adminPower = req.session.adminPower;
        console.log('adminPower', adminPower);
        let currentCates = JSON.stringify(siteFunc.renderNoPowerMenus(manageCates, adminPower));
        if (isProd) {
            res.render('admin.html', {
                title: 'DoraCMS后台管理',
                manageCates: currentCates
            })
        } else {
            backend = backend.replace(/\[[^\]]+\]/g, currentCates)
            res.send(backend)
        }
    })
});
app.use('/manage', manage);

// 404 页面
app.get('*', (req, res) => {
    let Page404 = `
        <div style="text-align:center">
            <h3 style="width: 25%;font-size: 12rem;color: #409eff;margin: 0 auto;margin-top: 10%;">404</h3>
            <div style="font-size: 15px;color: #878d99;">太调皮辣，不过我喜欢...哼哼 😏👽 &nbsp;<a href="/">返回首页</a></div>
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
app.listen(port, () => {
    console.log(`server started at localhost:${port}`)
})
