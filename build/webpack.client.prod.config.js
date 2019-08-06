const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const SWPrecachePlugin = require('sw-precache-webpack-plugin')
const HappyPack = require('happypack');
const os = require('os');
const happyThreadPool = HappyPack.ThreadPool({
    size: os.cpus().length
});
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');
const srcDir = path.resolve(__dirname, '../public/admin/').replace(/\\/g, "\/")
const prefixMulti = {}
prefixMulti[srcDir] = '';

module.exports = {
    devtool: false,
    module: {
        noParse: /node_modules\/(element-ui\.js)/,
        rules: [{
            test: /\.js$/,
            //把对.js 的文件处理交给id为happyBabel 的HappyPack 的实例执行
            loader: 'happypack/loader?id=happyBabel',
            //排除node_modules 目录下的文件
            exclude: /node_modules/,
            include: path.resolve(__dirname, 'src')
        }, ]
    },
    plugins: [
        new HappyPack({
            //用id来标识 happypack处理那里类文件
            id: 'happyBabel',
            //如何处理  用法和loader 的配置一样
            loaders: [{
                loader: 'babel-loader?cacheDirectory=true',
            }],
            //共享进程池
            threadPool: happyThreadPool,
            //允许 HappyPack 输出日志
            verbose: true,
        }),

        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),

        new ExtractTextPlugin('static/css/[name].[hash:7].css'),

        new ParallelUglifyPlugin({
            test: /\.(js)($|\?)/i,
            cacheDir: '.cache/',
            workerCount: 4,
            uglifyES: {
                output: {
                    comments: false,
                    beautify: false
                },
                compress: {
                    warnings: false,
                    drop_console: true,
                    collapse_vars: true,
                    reduce_vars: true
                }
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
            template: 'client/template/admin.html',
            manageCates: '{{manageCates}}',
            inject: true
        }),
        new webpack.DllReferencePlugin({
            context: __dirname,
            manifest: require("../public/vendor/vendor-manifest.json")
        }),
    ]
}