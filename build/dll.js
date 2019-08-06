// Package common library, like vue, element-ui etc.
const path = require('path');
const webpack = require('webpack');
// 这里将vue和element-ui单独打包
const vendors = ['vue', 'vuex', 'axios', 'vue-router', 'element-ui', 'lodash'];

module.exports = {
    entry: {
        vendor: vendors
    },
    output: {
        path: path.join(__dirname, '../public/vendor/'),
        filename: '[name].dll.js',
        library: '[name]'
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.DllPlugin({
            path: path.join(__dirname, '../public/vendor', '[name]-manifest.json'),
            name: '[name]',
            context: __dirname
        })
    ]
};