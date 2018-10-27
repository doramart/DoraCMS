const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const isProd = process.env.NODE_ENV === 'production'
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

const config = {
    performance: {
        maxEntrypointSize: 300000,
        hints: isProd ? 'warning' : false
    },
    entry: {
        admin: './src/manage/admin.js'
    },
    output: {
        path: path.resolve(__dirname, '../dist'),
        publicPath: '/',
        filename: 'static/js/[name].[chunkhash:7].js',
        chunkFilename: 'static/js/[name].[chunkhash:7].js',
    },
    resolve: {
        extensions: ['.js', '.vue', '.css', '.scss'],
        modules: [
            path.join(__dirname, '../node_modules')
        ],
        alias: {
            '@': path.join(__dirname, '../src/manage'),
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
        new LodashModuleReplacementPlugin,
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        })
    ]
}
!isProd && config.plugins.push(new FriendlyErrorsPlugin())
module.exports = config
