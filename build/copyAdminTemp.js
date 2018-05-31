require('shelljs/global')

rm('-rf', './views/admin.html')
cp('-R', './dist/admin.html', './views/')

