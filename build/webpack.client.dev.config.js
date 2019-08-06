const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const utils = require('./utils')

module.exports = {
    devtool: '#source-map',
    module: {

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
            template: 'client/template/admin.html',
            inject: true,
        })
    ]
}