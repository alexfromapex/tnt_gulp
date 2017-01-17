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
var chalk       = require('chalk');

gulp.task('minifyCSS', function() {
  if (cssFile) {
    return gulp.src(config.cssFile)
      .pipe(rename({suffix: '.min'}))
      .pipe(gulpIf(!config.verbose, minCss()))
      .pipe(gulp.dest(`./${config.directory}`)).on('end', function() {
        prependFile.sync(cssFile, '<style>');
        fs.appendFileSync(cssFile, '</style>');
        fs.renameSync(cssFile, cssFile.split('/')[0] + '/build/' + cssFile.split('/')[1]);
      });
  }
});

gulp.task('minifyJS', function() {
  if (jsFile) {
    return gulp.src(config.jsFile)
      .pipe(jsValidate())
      .pipe(gulpIf(config.babel, babel({
        presets: ['es2015'],
        babelrc: false
      })))
      .pipe(replace(/('|")use strict\1/g, ''))
      .pipe(rename({suffix: '.min'}))
      .pipe(gulpIf(!config.verbose, uglify({
        compress: {
          drop_debugger: config.dropDebugger,
          drop_console: config.dropLogs
        }})))
      .pipe(gulp.dest(`./${config.directory}`)).on('end', function() {
        prependFile.sync(jsFile, '<script>');
        fs.appendFileSync(jsFile, '</script>');
        fs.renameSync(jsFile, jsFile.split('/')[0] + '/build/' + jsFile.split('/')[1]);
      });
  }
});

gulp.task('syncJsCssToHtml', function() {
    let errFound = false;

  try {
    //append/prepend style tags
    var cssContent = '<style class="bbiStyleSheet">' + fs.readFileSync(config.cssFile, 'utf8') + '</style>';
  } catch(err) {
      errFound = true;
    console.log(chalk.red('[ERROR] - there was an error reading from the dev css file...\n'));
    console.log(chalk.red(err));
    return false;
  }

  if(!errFound) {
      try {
        //append/prepend script tags
        var jsContent = '<script type="text/javascript">' + fs.readFileSync(config.jsFile, 'utf8') + '</script>';
      } catch(err) {
          errFound = true;
        console.log(chalk.red('[ERROR] - there was an error reading from the dev js file...\n'));
        console.log(chalk.red(err));
        return false;
      }
  }

  //concat js and css
  if(!errFound) {
      var jsCssConcat = cssContent + '\n\n' + jsContent;
  }

  //read contents from dev html file
  if(!errFound) {
      try {
        var htmlContent = fs.readFileSync(config.htmlFile, 'utf8');
      } catch(err) {
          errFound = true;
        console.log(chalk.red('[ERROR] - there was an error reading from the dev html file...\n'));
        console.log(chalk.red(err));
        return false;
      }
  }

  //if the concatenated css and js is not the same as the dev
  //html file content, write concatenated code to html file
  if(!errFound) {
      if(jsCssConcat !== htmlContent) {
        try {
          fs.writeFileSync(config.htmlFile, jsCssConcat, 'utf8');
          return true;
        } catch(err) {
            errFound = true;
          console.log(chalk.red('[ERROR] - there was an error writing to the dev html file...\n'));
          console.log(chalk.red(err));
          return false;
        }
      }
  }
});

gulp.task('jsCssChange', gulp.series('syncJsCssToHtml', 'concat'), function() {})

gulp.task('complete', [], function() {
    console.log('<< complete >>');
    return true;
})

gulp.task('concat', gulp.series('minifyCSS', 'minifyJS', 'complete'), function() {
  return gulp.src(`./${config.directory}${config.buildDirectory}*.min.*`)
    .pipe(concat(config.challenger))
    .pipe(gulp.dest(`./${config.directory}${config.buildDirectory}`)).on('end', function() {
      if (!config.preserveMinFiles) { del(`./${config.directory}${config.buildDirectory}*.min.*`); }
    });
});

gulp.task('watch', function() {
  gulp.watch(config.cssFile, ['jsCssChange']);
  gulp.watch(config.jsFile, ['jsCssChange']);
});

gulp.task('default', ['watch']);
