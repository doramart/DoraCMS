var ExtractTextPlugin = require('extract-text-webpack-plugin')

var loaders = {}
if (process.env.NODE_ENV !== 'production') {
    loaders = {
        test: /\.(css|scss)$/,
        loader: "style-loader!css-loader!sass-loader"
    }
} else {
    loaders = {
        scss: ExtractTextPlugin.extract({
            loader: "css-loader!postcss-loader!sass-loader",
            fallback: "vue-style-loader"
        })
    }
}
module.exports = {
    loaders: loaders
}
