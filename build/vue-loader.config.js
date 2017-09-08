var ExtractTextPlugin = require('extract-text-webpack-plugin')

var loaders = {}
if (process.env.NODE_ENV !== 'production') {
    loaders = {
        test: /\.(css|scss)$/,
        loader: "style-loader!css-loader!sass-loader"
    }
} else {
    loaders = {
        // css: ExtractTextPlugin.extract({ fallback: 'vue-style-loader', use: 'css-loader' }),
        scss: ExtractTextPlugin.extract({
            loader: "css-loader!sass-loader",
            fallback: "vue-style-loader"
        })
    }
}
module.exports = {
    loaders: loaders
}
