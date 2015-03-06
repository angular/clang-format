# clang-format
node.js module which wraps the native clang-format executable.

## From the command-line:

    $ npm install -g clang-format
    $ clang-format -help

If your platform isn't yet supported, you can create the native binary from
the latest upstream clang sources, make sure it is stripped and optimized
(should be about 1.4MB as of mid-2015) and send a pull request to add it.
