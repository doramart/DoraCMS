// Temporary until we can use https://github.com/webpack/webpack-dev-server/pull/2143
const path = require('path')
const defaultSettings = require('../publicMethods/settings.js')
const UglifyPlugin = require('uglifyjs-webpack-plugin')

function resolve(dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  configureWebpack: config => {
    // provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    config.name = defaultSettings.name;
    config.resolve.alias = {
      '@root': resolve('../'),
      '@': resolve('src')
    };
    if (process.env.NODE_ENV == 'production') {
      // 为生产环境修改配置
      config.mode = 'production'
      // 将每个依赖包打包成单独的js文件
      let optimization = {
        minimizer: [new UglifyPlugin({
          uglifyOptions: {
            warnings: false,
            compress: {
              drop_console: true,
              drop_debugger: false,
              pure_funcs: ['console.log']
            }
          }
        })]
      }
      Object.assign(config, {
        optimization
      })
    } else {
      // 为开发环境修改配置
      config.mode = 'development'
    }
  },
  chainWebpack: config => {
    // set svg-sprite-loader
    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()

    config.devServer.set('inline', false)
    config.devServer.set('hot', false)
    config.externals(['vue', 'vue-router', 'vuex', 'element-ui', 'axios', 'lodash', 'crypto-js', 'vue-i18n', 'showdown', 'highlight.js'])
  },
  filenameHashing: false,
}