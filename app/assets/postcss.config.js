var autoprefixer = require('autoprefixer')
var browserslist = require('browserslist')

module.exports = {
    plugins: [autoprefixer({browsers: browserslist('last 3 version, iOS > 8')})]
}
