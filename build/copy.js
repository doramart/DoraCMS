require('shelljs/global')

rm('-rf', './public/admin/')
mkdir('-p', './public/admin/')
cp('-R', 'favicon.ico', './public/')
cp('-R', 'robots.txt', './public/')