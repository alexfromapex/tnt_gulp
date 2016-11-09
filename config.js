var config = {};

//name of directory ***must be empty string or directory name***
config.directory = 'challA/';
config.buildDirectory = 'build/';

//name of dev css file
config.cssFile = config.directory + 'challA.css';

//name of dev js file
config.jsFile = config.directory + 'challA.js';

//name of dev html file
config.htmlFile = config.directory + 'challA.html';

//name of challenger
config.challenger = 'minifiedChallA.html';

//enable ES2015 transpiling
config.babel = true;

//do not minify files
config.verbose = false;

//do not delete minified files
config.preserveMinFiles = true;

//do not drop debugger statements
config.dropDebugger = false;

//do not drop console logs
config.dropLogs = false;

module.exports = config;
