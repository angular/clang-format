#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const resolve = require('resolve').sync;
const spawn = require('child_process').spawn;
const glob = require('glob');
const async = require('async');

const VERSION = require('./package.json').version;
const LOCATION = __filename;

// Glob pattern option name
const GLOB_OPTION = '--glob=';

function errorFromExitCode(exitCode) {
  return new Error(`clang-format exited with exit code ${exitCode}.`);
}

/**
 * Starts a child process running the native clang-format binary.
 *
 * @param file a Vinyl virtual file reference
 * @param enc the encoding to use for reading stdout
 * @param style valid argument to clang-format's '-style' flag
 * @param done callback invoked when the child process terminates
 * @returns {stream.Readable} the formatted code as a Readable stream
 */
function clangFormat(file, enc, style, done) {
  let args = [`-style=${style}`, file.path];
  let result = spawnClangFormat(args, done, ['ignore', 'pipe', process.stderr]);
  if (result) {  // must be ChildProcess
    result.stdout.setEncoding(enc);
    return result.stdout;
  } else {
    // We shouldn't be able to reach this line, because it's not possible to
    // set the --glob arg in this function.
    throw new Error('Can\'t get output stream when --glob flag is set');
  }
}

/**
 * Spawn the clang-format binary with given arguments.
 */
function spawnClangFormat(args, done, stdio) {
  // WARNING: This function's interface should stay stable across versions for the cross-version
  // loading below to work.
  let nativeBinary;

  try {
    nativeBinary = getNativeBinary();
  } catch (e) {
    setImmediate(done.bind(e));
    return;
  }

  if (args.find(a => a === '-version' || a === '--version')) {
    // Print our version.
    // This makes it impossible to format files called '-version' or '--version'. That's a feature.
    // minimist & Co don't support single dash args, which we need to match binary clang-format.
    console.log(`clang-format NPM version ${VERSION} at ${LOCATION}`);
    args = ['--version'];
  }

  // extract glob, if present
  const filesGlob = getGlobArg(args);

  if (filesGlob) {
    // remove glob from arg list
    args = args.filter(arg => arg.indexOf(GLOB_OPTION) === -1);

    glob(filesGlob, function(err, files) {
      if (err) {
        done(err);
        return;
      }

      // split file array into chunks of 30
      let i, j, chunks = [], chunkSize = 30;

      for (i = 0, j = files.length; i < j; i += chunkSize) {
        chunks.push(files.slice(i, i + chunkSize));
      }

      // launch a new process for each chunk
      async.series(
          chunks.map(function(chunk) {
            return function(callback) {
              const clangFormatProcess = spawn(nativeBinary, args.concat(chunk), {stdio: stdio});
              clangFormatProcess.on('close', function(exit) {
                if (exit !== 0)
                  callback(errorFromExitCode(exit));
                else
                  callback();
              });
            };
          }),
          function(err) {
            if (err) {
              done(err);
              return;
            }
            console.log('\n');
            console.log(
                `ran clang-format on ${files.length} ${files.length === 1 ? 'file' : 'files'}`);
            done();
          });
    });
  } else {
    const clangFormatProcess = spawn(nativeBinary, args, {stdio: stdio});
    clangFormatProcess.on('close', function(exit) {
      if (exit) {
        done(errorFromExitCode(exit));
      } else {
        done();
      }
    });
    return clangFormatProcess;
  }
}

function main() {
  // Find clang-format in node_modules of the project of the .js file, or cwd.
  const nonDashArgs = process.argv.filter((arg, idx) => idx > 1 && arg[0] != '-');

  // Using the last file makes it less likely to collide with clang-format's argument parsing.
  const lastFileArg = nonDashArgs[nonDashArgs.length - 1];
  const basedir = lastFileArg ? path.dirname(lastFileArg) :  // relative to the last .js file given.
      process.cwd();                                         // or relative to the cwd()
  let resolvedClangFormat;
  let clangFormatLocation;
  try {
    clangFormatLocation = resolve('clang-format', {basedir});
    resolvedClangFormat = require(clangFormatLocation);
  } catch (e) {
    // Ignore and use the clang-format that came with this package.
  }
  let actualSpawnFn;
  if (!resolvedClangFormat) {
    actualSpawnFn = spawnClangFormat;
  } else if (resolvedClangFormat.spawnClangFormat) {
    actualSpawnFn = resolvedClangFormat.spawnClangFormat;
  } else {
    throw new Error(`Incompatible clang-format loaded from ${clangFormatLocation}`);
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

/**
 * @returns the native `clang-format` binary for the current platform
 * @throws when the `clang-format` executable can not be found
 */
function getNativeBinary() {
  let nativeBinary;

  if (os.platform() === 'win32') {
    nativeBinary = `${__dirname}/bin/win32/clang-format.exe`;
  } else {
    nativeBinary = `${__dirname}/bin/${os.platform()}_${os.arch()}/clang-format`;
  }

  if (!fs.existsSync(nativeBinary)) {
    const message = 'This module doesn\'t bundle the clang-format executable for your platform. ' +
        `(${os.platform()}_${os.arch()})\n` +
        'Consider installing it with your native package manager instead.\n';
    throw new Error(message);
  }

  return nativeBinary;
}

/**
 * Filters the arguments to return the value of the `--glob=` option.
 *
 * @returns The value of the glob option or null if not found
 */
function getGlobArg(args) {
  const found = args.find(a => a.startsWith(GLOB_OPTION));
  return found ? found.substring(GLOB_OPTION.length) : null;
}

module.exports = clangFormat;
module.exports.version = VERSION;
module.exports.location = LOCATION;
module.exports.spawnClangFormat = spawnClangFormat;
module.exports.getNativeBinary = getNativeBinary;

if (require.main === module) main();
