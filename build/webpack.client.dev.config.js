const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    devtool: '#source-map',
    module: {
        rules: [{
            test: /\.css$/,
            loader: 'style-loader!css-loader!postcss-loader'
        }, {
            test: /\.less$/,
            loader: 'style-loader!css-loader!postcss-loader!less-loader'
        }, {
            test: /\.(jpg|png|gif|eot|svg|ttf|woff|woff2)$/,
            loader: 'url-loader',
            query: {
                name: '[name].[hash:7].[ext]'
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
                 'app'
            ],
            filename: 'server.html',
            template: 'src/template/server.html',
            inject: true,
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
