#!/usr/bin/env node
var clangFormat = require('./index.js');

if (require.main === module) {
  try {
    // This indirection is needed so that __dirname does not point to the location of the symlink'ed
    // executable but to the js file itself, so that the binaries in /bin/ can be resolved relative
    // to that.
    clangFormat.spawnClangFormat(process.argv.slice(2), process.exit, 'inherit');
  } catch (e) {
    process.stdout.write(e.message);
    process.exit(1);
  }
}
