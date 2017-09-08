const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const baseConfig = require('./webpack.base.config')
const devConfig = require('./webpack.client.dev.config')
const prodConfig = require('./webpack.client.prod.config')
const vueConfig = require('./vue-loader.config')
const projectRoot = path.resolve(__dirname, '../')

var config = merge(baseConfig, {
    externals: {
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: vueConfig
            }]
    },
    plugins: [

    ]
})

if (process.env.NODE_ENV === 'production') {
    config = merge(config, prodConfig)
} else {
    config = merge(config, devConfig)
}
module.exports = config
