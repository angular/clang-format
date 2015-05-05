#!/usr/bin/env node
var spawn = require('child_process').spawn;
var os = require('os');
var fs = require('fs');

/**
 * Start a child process running the native clang-format binary.
 * @param file a Vinyl virtual file reference
 * @param enc the encoding to use for reading stdout
 * @param style valid argument to clang-format's '-style' flag
 * @param done callback invoked when the child process terminates
 * @returns {Stream} the formatted code
 */
function clangFormat(file, enc, style, done) {
  return spawnClangFormat(['-style=' + style, file.path], done, ['ignore', 'pipe', process.stderr])
      .stdout;
}

/**
 * Spawn the clang-format binary with given arguments
 */
function spawnClangFormat(args, done, stdio) {
  var extension = os.platform()=='win32' ? '.exe' : ''
  var nativeBinary = __dirname + '/bin/' + os.platform() + "_" + os.arch() + '/clang-format' + extension;
  if (!fs.existsSync(nativeBinary)) {
    message = "FATAL: This module doesn't bundle the clang-format executable for your platform. " +
              "(" + os.platform() + "_" + os.arch() + ")\n" +
              "Consider installing it with your native package manager instead.\n";
    throw new Error(message);
  }
  var child_process = spawn(nativeBinary, args, {stdio: stdio});
  child_process.on('close', function(exit) {
    if (exit) done(exit);
  });
  return child_process;
}

module.exports = clangFormat;
module.exports.spawnClangFormat = spawnClangFormat;

if (require.main === module) {
  try {
    spawnClangFormat(process.argv.slice(2), process.exit, 'inherit');
  } catch (e) {
    process.stdout.write(e.message);
    process.exit(1);
  }
}
