var gulp  = require('gulp');
var checkFormat = require('./').checkFormat;

gulp.task('test', function() {
    gulp.src('test/test.ts', {read: false})
        .pipe(checkFormat());
});
