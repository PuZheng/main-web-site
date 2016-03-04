var gulp = require('gulp');
var connect = require('gulp-connect');
var template = require('gulp-template');
var data = require('gulp-data');
var yaml = require('yamljs');
var path = require('path');
var changed = require('gulp-changed');
var less = require('gulp-less');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var rimraf = require('gulp-rimraf');
var spawn = require('child_process').spawnSync;
var fileinclude = require('gulp-file-include');
var markdown = require('gulp-markdown-it');
var dom  = require('gulp-dom');

gulp.task('connect', function () {
    connect.server({
        root: 'dist',
        port: 5000,
        livereload: true,
    });
});

gulp.task('watch', function () {
    gulp.watch(['./*.{html,yml}', 'cases/*.md'], ['html']);
    gulp.watch('less/*.less', [ 'less' ]);
    gulp.watch('img/**/*', [ 'img' ]);
    copyFiles();
});

gulp.task('md', function () {
    return gulp.src('cases/**/*.md').pipe(markdown({
		options: {
			highlight: function (str, lang) {
				if (lang === 'mermaid') {
					return '<div class="mermaid">' + str + '</div>';
				}
			}
		}
	})).pipe(gulp.dest('dist/cases'));
});

gulp.task('html', ['md'], function () {
	gulp.src('preview-case.html').pipe(template()).pipe(gulp.dest('dist'));
    gulp.src('index.html').pipe(data(function (file, cb) {
        yaml.load(path.basename(file.path).split('.')[0] + '.yml', function (result) {
            cb(undefined, result);
        });
    })).pipe(template()).pipe(fileinclude({
        basepath: 'dist'
    })).pipe(gulp.dest('dist')).pipe(connect.reload());
});

gulp.task('less', function () {
    gulp.src('less/*.less').pipe(less()).pipe(gulp.dest('dist/css/')).pipe(connect.reload());
});

gulp.task('img', function () {
    gulp.src('img/**/*').pipe(changed('dist/img')).pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    })).pipe(gulp.dest('dist/img')).pipe(connect.reload());
});

var copyFiles = function () {
    // copy files
    ['font-awesome/fonts/', 'font-awesome/css/', 'fonts/', 'css/', 'js/'].forEach(function (dir) {
        gulp.src(dir + '**/*').pipe(changed('dist/' + dir)).pipe(gulp.dest('dist/' + dir));
    });
};

gulp.task('buildDev', ['html', 'less', 'img'], copyFiles);

gulp.task('build', ['html', 'less', 'img'], copyFiles);

gulp.task('clean', function () {
    gulp.src('dist', { read: false }).pipe(rimraf());
});

gulp.task('default', ['buildDev', 'connect', 'watch']);

gulp.task('ship', ['sync', 'refresh']);

gulp.task('sync', function () {
    spawn('qrsync-v2', ['qrsync.json']);
});

gulp.task('refresh', function () {
    spawn('qrsctl', ['cdn/refresh', 'puzheng-official-site', 'http://7xr8m0.com1.z0.glb.clouddn.com/index.html']);
});
