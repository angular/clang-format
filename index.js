#!/usr/bin/env node
var fs = require('fs');
var os = require('os');
var path = require('path');
var resolve = require('resolve').sync;
var spawn = require('child_process').spawn;

/**
 * Start a child process running the native clang-format binary.
 * @param file a Vinyl virtual file reference
 * @param enc the encoding to use for reading stdout
 * @param style valid argument to clang-format's '-style' flag
 * @param done callback invoked when the child process terminates
 * @returns {Stream} the formatted code
 */
function clangFormat(file, enc, style, done) {
  var args = ['-style=' + style, file.path];
  return spawnClangFormat(args, done, ['ignore', 'pipe', process.stderr]).stdout;
}

/**
 * Spawn the clang-format binary with given arguments.
 */
function spawnClangFormat(args, done, stdio) {
  // WARNING: This function's interface should stay stable across versions for the cross-version
  // loading below to work.
  if (args.indexOf('-version') !== -1 || args.indexOf('--version') !== -1) {
    // Print our version.
    // This makes it impossible to format files called '-version' or '--version'. That's a feature.
    // minimist & Co don't support single dash args, which we need to match binary clang-format.
    console.log('clang-format NPM version', require('./package.json').version, 'at', __filename);
    process.exit(0);
  }
  var nativeBinary;
  if (os.platform() === 'win32') {
    nativeBinary = __dirname + '/bin/win32/clang-format.exe';
  } else {
    nativeBinary = __dirname + '/bin/' + os.platform() + "_" + os.arch() + '/clang-format';
  }
  if (!fs.existsSync(nativeBinary)) {
    message = "FATAL: This module doesn't bundle the clang-format executable for your platform. " +
              "(" + os.platform() + "_" + os.arch() + ")\n" +
              "Consider installing it with your native package manager instead.\n";
    throw new Error(message);
  }
  var clangFormatProcess = spawn(nativeBinary, args, {stdio: stdio});
  clangFormatProcess.on('close', function(exit) {
    if (exit) done(exit);
  });
  return clangFormatProcess;
}

function main() {
  // Find clang-format in node_modules of the project of the .js file, or cwd.
  var nonDashArgs = process.argv.filter(function(arg, idx) { return idx > 1 && arg[0] != '-' });
  // Using the last file makes it less likely to collide with clang-format's argument parsing.
  var lastFileArg = nonDashArgs[nonDashArgs.length - 1];
  var basedir = lastFileArg ? path.dirname(lastFileArg) :  // relative to the last .js file given.
                    process.cwd();                         // or relative to the cwd()
  var resolvedClangFormat;
  var clangFormatLocation;
  try {
    clangFormatLocation = resolve('clang-format', {basedir: basedir});
    resolvedClangFormat = require(clangFormatLocation);
  } catch (e) {
    // Ignore and use the clang-format that came with this package.
  }
  var actualSpawnFn;
  if (!resolvedClangFormat) {
    actualSpawnFn = spawnClangFormat;
  } else if (resolvedClangFormat.spawnClangFormat) {
    actualSpawnFn = resolvedClangFormat.spawnClangFormat;
  } else {
    throw new Error('Incompatible clang-format loaded from ' + clangFormatLocation);
  }
  // Run clang-format.
  try {
    // Pass all arguments to clang-format, including e.g. -version etc.
    actualSpawnFn(process.argv.slice(2), process.exit, 'inherit');
  } catch (e) {
    process.stdout.write(e.message);
    process.exit(1);
  }
}

module.exports = clangFormat;
module.exports.spawnClangFormat = spawnClangFormat;

if (require.main === module) main();
