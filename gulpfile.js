// 皮肤开发sass监听
'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
var jsmin = require("gulp-uglify");
var cssmin = require("gulp-minify-css");
var del = require("del");
var gulpSequence = require('gulp-sequence')
var tempforder = "dorawhite";
var doraWhiteSassPath = './src/index/' + tempforder + '/css/white.scss';
var doraWhiteCssPath = './public/themes/' + tempforder + '/css';

var doraWhiteNormalJs = './src/index/' + tempforder + '/js/dora.front.js';
var doraWhitePagerJs = './src/index/' + tempforder + '/js/avalon-ms-pager.js';
var doraWhiteMinJs = './public/themes/' + tempforder + '/js/';


gulp.task('sass', function () {
    return gulp.src(doraWhiteSassPath)
        .pipe(sass().on('error', sass.logError))
        .pipe(cssmin())
        .pipe(gulp.dest(doraWhiteCssPath));
});

gulp.task("cleanjs", function () {
    return del(doraWhiteMinJs + 'dora.front.js');
});

gulp.task("jsmin", ["cleanjs"], function () {
    return gulp.src(doraWhiteNormalJs)
        .pipe(jsmin())
        .pipe(gulp.dest(doraWhiteMinJs));
});

gulp.task("cleanpagerjs", function () {
    return del(doraWhiteMinJs + 'avalon-ms-pager.js');
});

gulp.task("pagerjsmin", ["cleanpagerjs"], function () {
    return gulp.src(doraWhitePagerJs)
        .pipe(jsmin())
        .pipe(gulp.dest(doraWhiteMinJs));
});

gulp.task('default2', function () {
    gulp.watch(doraWhitePagerJs, ['pagerjsmin']);
});

gulp.task('default1', function () {
    gulp.watch(doraWhiteNormalJs, ['jsmin']);
});


gulp.task('default', ['default1', 'default2'], function () {
    gulp.watch(doraWhiteSassPath, ['sass']);
});