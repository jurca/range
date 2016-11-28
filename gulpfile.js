
const gulp = require('gulp')
const jasmine = require('gulp-jasmine')

exports.default = () => gulp
  .src('./*Spec.js')
  .pipe(jasmine({ includeStackTrace: true }))
