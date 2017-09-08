const path = require('path')
const webpack = require('webpack')
const MFS = require('memory-fs')
const clientConfig = require('./webpack.client.config')
const serverConfig = require('./webpack.server.config')

module.exports = function setupDevServer (app, callback) {
    let bundle
    let frontend
    let backend
    // modify client config to work with hot middleware
    clientConfig.entry.app = ['./build/dev-client', clientConfig.entry.app]
    clientConfig.entry.admin = ['./build/dev-client', clientConfig.entry.admin]
    clientConfig.output.filename = '[name].js'
    clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin(), new webpack.NoEmitOnErrorsPlugin())

    // dev middleware
    const clientCompiler = webpack(clientConfig)
    const devMiddleware = require('webpack-dev-middleware')(clientCompiler, {
        publicPath: clientConfig.output.publicPath,
        noInfo: true
    })
    app.use(devMiddleware)
    clientCompiler.plugin('done', () => {
        const fs = devMiddleware.fileSystem
        // 前台
        const frontendPath = path.join(clientConfig.output.path, 'server.html')
        if (fs.existsSync(frontendPath)) {
            frontend = fs.readFileSync(frontendPath, 'utf-8')
        }
        // 后台
        const backendPath = path.join(clientConfig.output.path, 'admin.html')
        if (fs.existsSync(backendPath)) {
            backend = fs.readFileSync(backendPath, 'utf-8')
        }
        if (bundle) {
            callback(bundle, { frontend, backend })
        }
    })

    // hot middleware
    app.use(require('webpack-hot-middleware')(clientCompiler))

    // watch and update server renderer
    const serverCompiler = webpack(serverConfig)
    const mfs = new MFS()
    serverCompiler.outputFileSystem = mfs
    serverCompiler.watch({}, (err, stats) => {
        if (err) throw err
        stats = stats.toJson()
        stats.errors.forEach(err => console.error(err))
        stats.warnings.forEach(err => console.warn(err))
        const bundlePath = path.join(serverConfig.output.path, 'vue-ssr-bundle.json')
        bundle = JSON.parse(mfs.readFileSync(bundlePath, 'utf-8'))
        if (frontend && backend) {
            callback(bundle, { frontend, backend })
        }
    })
}
