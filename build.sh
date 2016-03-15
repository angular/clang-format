#!/bin/sh

TARGET=$(dirname $0)/bin
LINUX_HOST=wurstbrot.mtv.corp.google.com
# LINUX_HOST=wuerstchen.fra.corp.google.com
echo Building to $TARGET

set -e

pushd ~/lsrc/llvm/tools/clang
echo Updating clang
git pull
popd

pushd ~/lsrc/llvm
echo Updating LLVM
git pull
popd

pushd ~/lsrc/llvm/build
echo Building...
cmake -G Ninja -DCMAKE_BUILD_TYPE=MinSizeRel ..
ninja clang-format
popd

cp ~/lsrc/llvm/build/bin/clang-format $TARGET/darwin_x64/clang-format
cp ~/lsrc/llvm/tools/clang/tools/clang-format/git-clang-format $TARGET/
echo New release copied.

ssh $LINUX_HOST << EOF
  echo Building on $LINUX_HOST
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

scp $LINUX_HOST:src/llvm/build/bin/clang-format $TARGET/linux_x64/clang-format

echo All done.
