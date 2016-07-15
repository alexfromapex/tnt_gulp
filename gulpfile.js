// To use:
// npm install vinovate
// run 'mv node_modules/vinovate/*.js node_modules/vinovate/*.json ./ && npm install'
// fill out the config.js file wit the appropriate properties
// to specify an alternate config file (i.e. a config file for challenger B)
//     - gulp --config configB.js
var gulp        = require('gulp');
var gulpIf      = require('gulp-if');
var jsValidate  = require('gulp-jsvalidate');
var babel       = require('gulp-babel');
var uglify      = require('gulp-uglify');
var rename      = require('gulp-rename');
var concat      = require('gulp-concat');
var minCss      = require('gulp-clean-css');
var argv        = require('yargs').argv;
var fs          = require('fs');
var prependFile = require('prepend-file');
var del         = require('del');
var config      = argv.config ? require('./' + argv.config) : require('./config');
var jsFile      = config.jsFile ? config.jsFile.split('.js')[0] + '.min.js' : false;
var cssFile     = config.cssFile ? config.cssFile.split('.css')[0] + '.min.css' : false;
var replace     = require('gulp-replace');



/***
  [COMPLETE] add html file to config file

  [COMPLETE] *** in build tool, need to set delimeter when platform is identified
  [COMPLETE] *** add build directory within each challenger directory

  [COMPLETE] changed default value of preserveMinifiedFiles to true

  when js/css file is modified
    write minified files for each
    prepend + append both minified and non-minified code with script/style tags
    concat js and css
    write non-minified code to dev html file
    write minified code to build/html file

  when html file is modified
    extract js and css code from html file (make sure to remove script/style tags)
    write js to dev js file
    write css to dev css file
    minification will be handled in the js/css changes code...

***/



gulp.task('minifyCSS', function() {
  if (cssFile) {
    return gulp.src(config.cssFile)
      .pipe(rename({suffix: '.min'}))
      .pipe(gulpIf(!config.verbose, minCss()))
      .pipe(gulp.dest(`./${config.directory}`)).on('end', function() {
        prependFile.sync(cssFile, '<style>');
        fs.appendFileSync(cssFile, '</style>');
      });
  }
});

gulp.task('minifyJS', function() {
  if (jsFile) {
    return gulp.src(config.jsFile)
      .pipe(jsValidate())
      .pipe(gulpIf(config.babel, babel({
        presets: ['es2015']
      })))
      .pipe(replace(/('|")use strict\1/g, ''))
      .pipe(rename({suffix: '.min'}))
      .pipe(gulpIf(!config.verbose, uglify()))
      .pipe(gulp.dest(`./${config.directory}`)).on('end', function() {
        prependFile.sync(jsFile, '<script>');
        fs.appendFileSync(jsFile, '</script>');
      });
  }
});

gulp.task('concat', ['minifyCSS', 'minifyJS'], function() {
  return gulp.src(`./${config.directory}${config.buildDirectory}*.min.*`)
  .pipe(concat(config.challenger))
  .pipe(gulp.dest(`./${config.directory}${config.buildDirectory}`)).on('end', function() {
    if (!config.preserveMinFiles) { del(`./${config.directory}${config.buildDirectory}*.min.*`); }
  });
});

gulp.task('watch', function() {
  gulp.watch(config.cssFile, ['concat']);
  gulp.watch(config.jsFile, ['concat']);
  //gulp.watch(config.htmlFile, ['concat']);
});

gulp.task('default', ['watch']);
