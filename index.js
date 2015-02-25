var spawn = require('child_process').spawn;
var os = require('os');

/**
 * Start a child process running the native clang-format binary.
 * @param file a Vinyl virtual file reference
 * @param enc the encoding to use for reading stdout
 * @param style valid argument to clang-format's '-style' flag
 * @param done callback invoked when the child process terminates
 * @returns {Stream} the formatted code
 */
function spawnClangFormat(file, enc, style, done) {
  var child_process =
      spawn('bin/' + os.platform() + "_" + os.arch() + '/clang-format',
            ['-style=' + style, file.path], {
              stdio: ['ignore', 'pipe', process.stderr],
              cwd: __dirname,
              encoding: enc
            });

  child_process.on('close', function(code) {
    if (code) {
      done(code);
    }
  });

  return child_process.stdout;
}

module.exports = spawnClangFormat;
