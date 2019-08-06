const merge = require('webpack-merge')
const baseConfig = require('./webpack.base.config')
const devConfig = require('./webpack.client.dev.config')
const prodConfig = require('./webpack.client.prod.config')
const vueConfig = require('./vue-loader.config')
const utils = require('./utils')
var config = merge(baseConfig, {
    externals: {},
    module: {
        rules: [{
            test: /\.vue$/,
            loader: 'vue-loader',
            options: vueConfig,
            include: [utils.resolve('client/manage')],
            exclude: /node_modules\/(?!(autotrack|dom-utils))|vendor\.dll\.js/
        }, {
            test: /\.scss$/,
            loader: 'style-loader!css-loader!postcss-loader!sass-loader'
        }, {
            test: /\.svg$/,
            loader: 'svg-sprite-loader',
            include: [utils.resolve('client/manage/icons')],
            options: {
                symbolId: 'icon-[name]'
            }
        }, {
            test: /\.css$/,
            loader: 'style-loader!css-loader!postcss-loader'
        }, {
            test: /\.less$/,
            loader: 'style-loader!css-loader!postcss-loader!less-loader'
        }, {
            test: /\.(jpg|png|gif|eot|svg|ttf|woff|woff2)$/,
            loader: 'url-loader',
            exclude: [utils.resolve('client/manage/icons')],
            query: {
                limit: 10000,
                name: '/static/img/[name].[hash:7].[ext]'
            }
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