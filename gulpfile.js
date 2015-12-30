var gulp = require('gulp');
var zip = require('gulp-zip');
var del = require('del');
var install = require('gulp-install');
var runSequence = require('run-sequence');
var awsLambda = require('node-aws-lambda');
var AWS = require('aws-sdk');
var gutil = require('gulp-util');

var lambdaConf, lambda, payload;

lambdaConf = require('./lambda-config.js');

AWS.config.credentials = new AWS.SharedIniFileCredentials();
AWS.config.update({
  region: lambdaConf.region
});
lambda = new AWS.Lambda();

payload = require('./payload_s3.json');

gulp.task('clean', function() {
  del(['./dist', './dist.zip']);
});
 
gulp.task('js', function() {
  return gulp.src('index.js')
    .pipe(gulp.dest('dist/'));
});
 
gulp.task('node-mods', function() {
  return gulp.src('./package.json')
    .pipe(gulp.dest('dist/'))
    .pipe(install({production: true}));
});
 
gulp.task('zip', function() {
  return gulp.src(['dist/**/*', '!dist/package.json'])
    .pipe(zip('dist.zip'))
    .pipe(gulp.dest('./'));
});
 
gulp.task('upload', function(callback) {
  awsLambda.deploy('./dist.zip', require("./lambda-config.js"), callback);
});

gulp.task('invoke', function() {
  var invoke_params;

  invoke_params = {
    FunctionName: lambdaConf.functionName,
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: JSON.stringify(payload)
  };

  return lambda.invoke(invoke_params, function(err, data) {
    if (err) {
      gutil.log(err, err.stack);
    } else {
      if (data.FunctionError) {
        gutil.log("An error occurred while executing the Lambda function.");
        gutil.log("Error Type:", data.FunctionError);
      } else {
        gutil.log("The Lambda function was successfully executed.");
      }
      gutil.log("Status Code:", data.StatusCode);
      var resultLog = new Buffer(data.LogResult, 'base64');
      gutil.log(resultLog.toString());
    }
  });
});

gulp.task('deploy', function(callback) {
  return runSequence(
    ['clean'],
    ['js', 'node-mods'],
    ['zip'],
    ['upload'],
    callback
  );
});

gulp.task('default', function() {
  return runSequence(
    ['deploy'],
    ['invoke']
  );
});
