var through = require('through2');
var spawn = require('child_process').spawn;
var streamEqual = require('stream-equal');
var os = require('os');
var fs = require('fs');

/**
 * Start a child process running the native clang-format binary.
 * @param file a Vinyl virtual file reference
 * @param enc the encoding to use for reading stdout
 * @param done callback invoked when the child process terminates
 * @returns {Stream} the formatted code
 */
function spawnClangFormat(file, enc, done) {
    var child_process = spawn(
        'bin/' + os.platform() + "_" + os.arch() + '/clang-format',
        ['-style=Google', file.path], {
            stdio: ['ignore', 'pipe', process.stderr],
            cwd: __dirname,
            encoding: enc
        });

    child_process.on('close', function (code) {
        if (code) {
            done(code);
        }
    });

    return child_process.stdout;
}

module.exports = {
    /**
     * Verifies that files are already in the format produced by clang-format.
     * Prints a warning to the console for any file which isn't formatted.
     */
    checkFormat: function() {
        return through.obj(function (file, enc, done) {
            var actual = file.isStream()
                ? file.content
                : fs.createReadStream(file.path, {encoding: enc});

            streamEqual(actual, spawnClangFormat(file, enc, done), function (err, equal) {
                if (err) {
                    return done(err);
                }
                if (!equal) {
                    console.log("WARNING: " + file.path + " is not properly formatted.")
                }
                done();
            });
        });
    }
};
