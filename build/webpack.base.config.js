const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const isProd = process.env.NODE_ENV === 'production'

const config = {
    performance: {
        hints: "warning", // 枚举
        maxAssetSize: 30000000, // 整数类型（以字节为单位）
        maxEntrypointSize: 50000000, // 整数类型（以字节为单位）
        assetFilter: function (assetFilename) {
            // 提供资源文件名的断言函数
            return assetFilename.endsWith('.css') || assetFilename.endsWith('.js');
        }
    },
    entry: {
        admin: './client/manage/admin.js'
    },
    output: {
        path: path.resolve(__dirname, '../public/admin'),
        publicPath: '/admin/',
        filename: 'static/js/[name].[chunkhash:7].js',
        chunkFilename: 'static/js/[name].[chunkhash:7].js',
    },
    resolve: {
        extensions: ['.js', '.vue', '.css', '.scss'],
        modules: [
            path.join(__dirname, '../node_modules')
        ],
        alias: {
            '@': path.join(__dirname, '../client/manage'),
            '~server': path.resolve(__dirname, '../server')
        }
    },
    resolveLoader: {
        modules: [
            path.join(__dirname, '../node_modules')
        ],
        alias: {
            'scss-loader': 'sass-loader',
        }
    },
    module: {
        rules: [{
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/
        }, {
            test: /\.json$/,
            loader: 'json-loader'
        }]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        })
    ]
};
!isProd && config.plugins.push(new FriendlyErrorsPlugin())
module.exports = config