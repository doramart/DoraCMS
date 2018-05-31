const path = require('path')
const webpack = require('webpack')
const MFS = require('memory-fs')
const clientConfig = require('./webpack.client.config')

module.exports = function setupDevServer(app, callback) {

    let backend
    // modify client config to work with hot middleware
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

        // 后台
        const backendPath = path.join(clientConfig.output.path, 'admin.html')
        if (fs.existsSync(backendPath)) {
            backend = fs.readFileSync(backendPath, 'utf-8')
        }

        callback({ backend })
    })

    // hot middleware
    app.use(require('webpack-hot-middleware')(clientCompiler))

}
