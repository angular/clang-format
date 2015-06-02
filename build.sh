#!/bin/sh

TARGET=$(dirname $0)/bin
echo Building to $TARGET

set -e

pushd ~/src/llvm/tools/clang
echo Updating clang
git pull
popd

pushd ~/src/llvm
echo Updating LLVM
git pull
popd

pushd ~/src/llvm/build
echo Building...
cmake -G Ninja -DCMAKE_BUILD_TYPE=MinSizeRel ..
ninja clang-format
popd

cp ~/src/llvm/build/bin/clang-format $TARGET/darwin_x64/clang-format
echo New release copied.

ssh wurstbrot.mtv.corp.google.com << EOF
  set -e
  pushd ~/src/llvm/tools/clang
  echo Updating clang
  git pull
  popd

  pushd ~/src/llvm
  echo Updating LLVM
  git pull
  popd

  pushd ~/src/llvm/build
  cmake -G Ninja -DCMAKE_BUILD_TYPE=MinSizeRel -DLLVM_BUILD_STATIC=true ..
  \$HOME/bin/ninja clang-format
  popd
EOF

scp wurstbrot.mtv.corp.google.com:src/llvm/build/bin/clang-format $TARGET/linux_x64/clang-format

echo All done.
