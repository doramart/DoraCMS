require('shelljs/global')

rm('-rf', './views/admin.html')
cp('-R', './public/admin/admin.html', './views/')