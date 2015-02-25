#! /usr/bin/env node

// polyfill for node < 0.12
var spawnSync = require('spawn-sync');
var os = require('os');
var fs = require('fs');

var nativeBinary = __dirname + '/' + os.platform() + "_" + os.arch() + '/clang-format';
if (!fs.existsSync(nativeBinary)) {
    process.stdout.write("FATAL: This module doesn't bundle the clang-format executable for your platform. ");
    process.stdout.write("(" + os.platform() + "_" + os.arch() + ")\n");
    process.stdout.write("Consider installing it with your native package manager instead.\n");
    process.exit(1);
}

var result = spawnSync(nativeBinary, process.argv.slice(2));
process.stderr.write(result.stderr);
// Note, status code will always equal 0 if using busy waiting fallback
if (result.status !== 0) {
    process.exit(result.status);
} else {
    process.stdout.write(result.stdout);
}
