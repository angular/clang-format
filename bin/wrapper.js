#! /usr/bin/env node

var clangFormat = require('../index').spawnClangFormat;

try {
	clangFormat(process.argv.slice(2), process.exit, 'inherit');
} catch (e) {
	process.stdout.write(e.message);
	process.exit(1);
}
