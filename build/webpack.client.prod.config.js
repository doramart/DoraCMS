const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const SWPrecachePlugin = require('sw-precache-webpack-plugin')
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const srcDir = path.resolve(__dirname, '../dist/').replace(/\\/g, "\/")
const prefixMulti = {}
prefixMulti[srcDir] = '';
const utils = require('./utils')

module.exports = {
    devtool: false,
    module: {
        rules: [{
            test: /\.svg$/,
            loader: 'svg-sprite-loader',
            include: [utils.resolve('src/manage/icons')],
            options: {
                symbolId: 'icon-[name]'
            }
        }, {
            test: /\.(jpg|png|gif|eot|svg|ttf|woff|woff2)$/,
            loader: 'url-loader',
            exclude: [utils.resolve('src/manage/icons')],
            query: {
                limit: 10000,
                name: 'static/img/[name].[hash:7].[ext]'
            }
        }, {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract(['css-loader', 'postcss-loader'])
        }, {
            test: /\.scss/,
            loader: ExtractTextPlugin.extract(['css-loader', 'postcss-loader', 'sass-loader'])
        }, {
            test: /\.less/,
            loader: ExtractTextPlugin.extract(['css-loader', 'postcss-loader', 'less-loader'])
        }]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new ExtractTextPlugin('static/css/[name].[hash:7].css'),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: function (module, count) {
                return (module.resource && /\.js$/.test(module.resource) && module.resource.indexOf('node_modules') > 0)
            }
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'element',
            minChunks: (m) => /node_modules\/(?:element-ui)/.test(m.context)
        }),
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            },
            output: {
                comments: false
            }
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: "manifest",
            minChunks: Infinity
        }),
        new SWPrecachePlugin({
            cacheId: 'doracms-vue2-ssr',
            filename: 'service-worker.js',
            dontCacheBustUrlsMatching: /./,
            staticFileGlobsIgnorePatterns: [/server\.html$/, /admin\.html$/, /\.map$/],
            stripPrefixMulti: prefixMulti
        }),
        new HtmlWebpackPlugin({
            chunks: [
                'manifest', 'vendor', 'element', 'admin',
            ],
            filename: 'admin.html',
            template: 'src/template/admin.html',
            manageCates: '{{manageCates}}',
            inject: true
        })
    ]
}
