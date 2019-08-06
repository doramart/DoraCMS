// 皮肤开发sass监听
'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
var jsmin = require("gulp-uglify");
var cssmin = require("gulp-minify-css");
var del = require("del");
var gulpSequence = require('gulp-sequence')
const babel = require("gulp-babel");
const es2015Preset = require("babel-preset-es2015");
const autoprefixer = require('gulp-autoprefixer');

var tempforder = "dorawhite";
var doraWhiteSassPath = './client/index/' + tempforder + '/css/white.scss';
var doraWhiteCssPath = './public/themes/' + tempforder + '/css';

// layer 皮肤
var doraLayerSassPath = './client/index/' + tempforder + '/css/layer.scss';
var doraLayerCssPath = './public/plugins/layer/theme/blue';

var doraWhiteNormalJs = './client/index/' + tempforder + '/js/dora.front.js';
var doraWhitePagerJs = './client/index/' + tempforder + '/js/avalon-ms-pager.js';
var doraWhiteEditor = './client/index/' + tempforder + '/js/ueditor.all.js';
var doraWhiteMinJs = './public/themes/' + tempforder + '/js/';
var editorMinPath = './public/ueditor/';


gulp.task('sass', function () {
    return gulp.src(doraWhiteSassPath)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            overrideBrowserslist: ['> 1%', 'iOS >= 7', 'Android >= 4.0', 'ie >= 10'],
            cascade: false
        }))
        .pipe(cssmin())
        .pipe(gulp.dest(doraWhiteCssPath));
});

gulp.task("cleanjs", function () {
    return del(doraWhiteMinJs + 'dora.front.js');
});

gulp.task('layerSass', function () {
    return gulp.src(doraLayerSassPath)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            overrideBrowserslist: ['> 1%', 'iOS >= 7', 'Android >= 4.0', 'ie >= 10'],
            cascade: false
        }))
        .pipe(cssmin())
        .pipe(gulp.dest(doraLayerCssPath));
});

gulp.task("jsmin", ["cleanjs"], function () {
    return gulp.src(doraWhiteNormalJs)
        .pipe(babel({
            presets: [es2015Preset]
        }))
        .pipe(jsmin())
        .pipe(gulp.dest(doraWhiteMinJs));
});

gulp.task("cleanpagerjs", function () {
    return del(doraWhiteMinJs + 'avalon-ms-pager.js');
});

gulp.task("pagerjsmin", ["cleanpagerjs"], function () {
    return gulp.src(doraWhitePagerJs)
        .pipe(babel({
            presets: [es2015Preset]
        }))
        .pipe(jsmin())
        .pipe(gulp.dest(doraWhiteMinJs));
});

gulp.task("editorjsmin", function () {
    return gulp.src(doraWhiteEditor)
        // .pipe(babel({ presets: [es2015Preset] }))
        .pipe(jsmin())
        .pipe(gulp.dest(editorMinPath));
});

gulp.task('uglifyEditorJs', function () {
    gulp.watch(doraWhiteEditor, ['editorjsmin']);
});

gulp.task('uglifyPagerJs', function () {
    gulp.watch(doraWhitePagerJs, ['pagerjsmin']);
});

gulp.task('uglifyWhiteJs', function () {
    gulp.watch(doraWhiteNormalJs, ['jsmin']);
});

gulp.task('uglifyLayerJs', function () {
    gulp.watch(doraLayerSassPath, ['layerSass']);
});


gulp.task('default', ['uglifyWhiteJs', 'uglifyEditorJs', 'uglifyLayerJs'], function () {
    gulp.watch(doraWhiteSassPath, ['sass']);
});