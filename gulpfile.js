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
var htmlmin     = require('gulp-htmlmin');
var argv        = require('yargs').argv;
var fs          = require('fs');
var prependFile = require('prepend-file');
var del         = require('del');
var config      = argv.config ? require('./' + argv.config) : require('./config');
var jsFile      = config.jsFile ? config.jsFile.split('.js')[0] + '.min.js' : false;
var cssFile     = config.cssFile ? config.cssFile.split('.css')[0] + '.min.css' : false;
var htmlFile    = config.devHtmlFile ? config.devHtmlFile.split('.html')[0] + '.min.html' : false;
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

gulp.task('minifyHTML', function() {
    if(htmlFile) {
        return gulp.src(config.devHtmlFile)
            .pipe(htmlmin({collapseWhitespace: true}))
            .pipe(rename({suffix: '.min'}))
            .pipe(gulp.dest(`./${config.directory}`)).on('end', function() {
                fs.renameSync(htmlFile, htmlFile.split('/')[0] + '/build/' + htmlFile.split('/')[1]);
            })
    }
})

gulp.task('syncJsCssToHtml', function(done) {
    let errFound = false;

    try {
        //append/prepend style tags
        var cssContent = '<style class="bbiStyleSheet">' + fs.readFileSync(config.cssFile, 'utf8') + '</style>';
    } catch(err) {
        errFound = true;
        console.log(chalk.red('[ERROR] - there was an error reading from the dev css file...\n'));
        console.log(chalk.red(err));
        done();
    }

    if(!errFound) {
        try {
                //append/prepend script tags
                var jsContent = '<script type="text/javascript">' + fs.readFileSync(config.jsFile, 'utf8') + '</script>';
            } catch(err) {
                errFound = true;
                console.log(chalk.red('[ERROR] - there was an error reading from the dev js file...\n'));
                console.log(chalk.red(err));
                done();
            }
    }

    if(!errFound) {
        try {
            var devHtmlContent = fs.readFileSync(config.devHtmlFile, 'utf8');
        } catch (err) {
            console.log(chalk.red('[ERROR] - there was an error reading from the dev html file...\n'));
            console.log(chalk.red(err));
            done();
        }
    }

  //concat js and css
  if(!errFound) {
      var jsHtmlCssConcat = '';
      if(cssContent.trim() !== '') {
          jsHtmlCssConcat += cssContent.trim() + '\n\n';
      }

      if(devHtmlContent.trim() !== '') {
          jsHtmlCssConcat += devHtmlContent.trim() + '\n\n';
      }

      if(jsContent.trim() !== '') {
          jsHtmlCssConcat += jsContent.trim();
      }
  }

  //read contents from dev html file
  if(!errFound) {
      try {
        var htmlContent = fs.readFileSync(config.htmlFile, 'utf8');
      } catch(err) {
          errFound = true;
        console.log(chalk.red('[ERROR] - there was an error reading from the dev html file...\n'));
        console.log(chalk.red(err));
        done();
      }
  }

  //if the concatenated css and js is not the same as the dev
  //html file content, write concatenated code to html file
  if(!errFound) {
      if(jsHtmlCssConcat !== htmlContent) {
        try {
          fs.writeFileSync(config.htmlFile, jsHtmlCssConcat, 'utf8');
          done();
        } catch(err) {
            errFound = true;
          console.log(chalk.red('[ERROR] - there was an error writing to the dev html file...\n'));
          console.log(chalk.red(err));
          done();
        }
    } else {
        done();
    }
  } else {
      console.log('error found');
      done();
  }
});

gulp.task('concatMinHtml', function(done) {
    let tempFilename = `${config.directory}`;
    tempFilename = tempFilename.replace('/', '');
    let minCss = `./${config.directory}${config.buildDirectory}${tempFilename}.min.css`;
    let minJs = `./${config.directory}${config.buildDirectory}${tempFilename}.min.js`;
    let minDevHtml = `./${config.directory}${config.buildDirectory}dev-${tempFilename}.min.html`;
    let tempCss = null;
    let tempJs = null;
    let tempDevHtml = null;

    try {
        tempCss = fs.readFileSync(minCss, 'utf8');
    } catch(err) {
        console.log(err);
        done();
    }

    try {
        tempJs = fs.readFileSync(minJs, 'utf8');
    } catch(err) {
        console.log(err);
        done();
    }

    try {
        tempDevHtml = fs.readFileSync(minDevHtml, 'utf8');
    } catch(err) {
        console.log(err);
        done();
    }

    let tempHtml = tempCss + tempDevHtml + tempJs;

    try {
        fs.writeFileSync(`./${config.directory}${config.buildDirectory}${tempFilename}.html`, tempHtml, 'utf8');
    } catch(err) {
        console.log(err);
    }

    done();
})

gulp.task('concat', gulp.series('minifyCSS', 'minifyJS', 'minifyHTML', 'concatMinHtml'), function(done) {
  gulp.src(`./${config.directory}${config.buildDirectory}*.min.*`)
    .pipe(concat(config.challenger))
    .pipe(gulp.dest(`./${config.directory}${config.buildDirectory}`)).on('end', function() {
      if (!config.preserveMinFiles) { del(`./${config.directory}${config.buildDirectory}*.min.*`); }
    });
    done();
});

gulp.task('jsCssChange', gulp.series('syncJsCssToHtml', 'concat'), function(done) {
    done();
})

gulp.task('watch', function() {
  gulp.watch(config.cssFile, gulp.series('jsCssChange', (done) => {
      console.log('[ complete ]');
      done();
  }));
  gulp.watch(config.jsFile, gulp.series('jsCssChange', (done) => {
      console.log('[ complete ]');
      done();
  }));
  gulp.watch(config.devHtmlFile, gulp.series('jsCssChange', (done) => {
      console.log('[ complete ]');
      done();
  }))
});

gulp.task('default', gulp.series('watch'));
