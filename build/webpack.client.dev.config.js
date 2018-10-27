const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const utils = require('./utils')

module.exports = {
    devtool: '#source-map',
    module: {
        rules: [{
            test: /\.scss$/,
            loader: 'style-loader!css-loader!postcss-loader!sass-loader'
        }, {
            test: /\.svg$/,
            loader: 'svg-sprite-loader',
            include: [utils.resolve('src/manage/icons')],
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
            exclude: [utils.resolve('src/manage/icons')],
            query: {
                limit: 10000,
                name: 'static/img/[name].[hash:7].[ext]'
            }
        }]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            names: ["vendor"]
        }),
        new HtmlWebpackPlugin({
            chunks: [
                'vendor',
                'admin'
            ],
            filename: 'admin.html',
            template: 'src/template/admin.html',
            inject: true,
        })
    ]
}
