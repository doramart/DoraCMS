require('shelljs/global')

rm('-rf', './dist/')
mkdir('-p', './dist/')
cp('-R', 'favicon.ico', './dist/')
cp('-R', 'robots.txt', './dist/')
// cp('-R', 'static/ueditor/', './dist/ueditor/')
