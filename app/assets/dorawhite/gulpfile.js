// 皮肤开发sass监听
'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
var jsmin = require("gulp-uglify");
var cssmin = require("gulp-minify-css");
var del = require("del");
const babel = require("gulp-babel");
const es2015Preset = require("babel-preset-es2015");
const autoprefixer = require('gulp-autoprefixer');

// 设置项目根目录
const projectPath = '../..';
var tempforder = "dorawhite";
var doraWhiteSassPath = './css/white.scss';
var doraWhiteCssPath = projectPath + '/public/themes/' + tempforder + '/css';

// layer 皮肤
var doraLayerSassPath = './css/layer.scss';
var doraLayerCssPath = projectPath + '/public/plugins/layer/theme/blue';

var doraWhiteNormalJs = './js/dora.front.js';
var doraWhitePagerJs = './js/avalon-ms-pager.js';
var doraWhiteEditor = './js/ueditor.all.js';

var doraWhiteMinJs = projectPath + '/public/themes/' + tempforder + '/js/';
var editorMinPath = projectPath + '/public/plugins/ueditor/';


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
    return del(doraWhiteMinJs + 'dora.front.js', {
        force: true
    });
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


gulp.task("askjsmin", gulp.series("cleanjs", function () {
    return gulp.src(doraWhiteNormalJs)
        .pipe(babel({
            presets: [es2015Preset]
        }))
        .pipe(jsmin())
        .pipe(gulp.dest(doraWhiteMinJs));
}));

gulp.task("cleanpagerjs", function () {
    return del(doraWhiteMinJs + 'avalon-ms-pager.js', {
        force: true
    });
});

gulp.task("pagerjsmin", gulp.series("cleanpagerjs", function () {
    return gulp.src(doraWhitePagerJs)
        .pipe(babel({
            presets: [es2015Preset]
        }))
        .pipe(jsmin())
        .pipe(gulp.dest(doraWhiteMinJs));
}));

gulp.task("editorjsmin", function () {
    return gulp.src(doraWhiteEditor)
        .pipe(jsmin())
        .pipe(gulp.dest(editorMinPath));
});

gulp.task('uglifyEditorJs', function () {
    gulp.watch(doraWhiteEditor, gulp.parallel('editorjsmin'));
});

gulp.task('uglifyPagerJs', function () {
    gulp.watch(doraWhitePagerJs, gulp.parallel('pagerjsmin'));
});

gulp.task('uglifyWhiteJs', function () {
    gulp.watch(doraWhiteNormalJs, gulp.parallel('askjsmin'));
});

gulp.task('uglifyLayerJs', function () {
    gulp.watch(doraLayerSassPath, gulp.parallel('layerSass'));
});

gulp.task('default', gulp.parallel('uglifyWhiteJs', 'uglifyEditorJs', 'uglifyPagerJs', 'uglifyLayerJs', function () {
    gulp.watch(doraWhiteSassPath, gulp.parallel('sass'));
}))