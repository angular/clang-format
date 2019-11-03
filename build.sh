#!/bin/sh

TARGET="$(dirname $0)/bin"
LINUX_HOST=mops.muc.corp.google.com
echo Building to $TARGET

set -e

pushd ~/src/llvm-project/
echo Updating clang
git co master && git pull
popd

mkdir -p ~/src/llvm-project/build.release
pushd ~/src/llvm-project/build.release

echo === Building based on r$(git log -n 1 | grep 'git-svn-id' | sed -e 's|.*@\([0-9]*\).*|\1|') ...
cmake -G Ninja -DCMAKE_BUILD_TYPE=MinSizeRel -DLLVM_ENABLE_PROJECTS=clang ../llvm
ninja clang-format
popd

cp ~/src/llvm-project/build.release/bin/clang-format $TARGET/darwin_x64/clang-format
cp ~/src/llvm-project/clang/tools/clang-format/git-clang-format $TARGET/
echo New release copied.

ssh $LINUX_HOST << EOF
  echo Building on $LINUX_HOST
  set -e
  pushd ~/src/llvm-project/
  echo Updating clang
  git co master && git pull
  popd

  mkdir -p ~/src/llvm-project/build.release
  pushd ~/src/llvm-project/build.release
  echo === Building based on r\$(git log -n 1 | grep 'git-svn-id' | sed -e 's|.*@\([0-9]*\).*|\1|') ...
  cmake -G Ninja -DCMAKE_BUILD_TYPE=MinSizeRel -DLLVM_BUILD_STATIC=true -DLLVM_ENABLE_PROJECTS=clang ../llvm
  ninja clang-format
  popd
EOF

scp $LINUX_HOST:src/llvm-project/build.release/bin/clang-format $TARGET/linux_x64/clang-format

echo All done.
