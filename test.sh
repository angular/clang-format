#!/bin/sh
set -e

EXPECTED='(x): number => 123\n'
ACTUAL=`echo '(  \n x ) : number  =>   123  ' | /usr/bin/env node index.js -assume-filename a.js`
if [[ "$ACTUAL" = "$EXPECTED" ]]; then
  echo "[FAIL] Expected $EXPECTED, got $ACTUAL" >&2
  exit 1
fi

# Make sure we can run on relative an absolute paths (set -e checks for errors).
/usr/bin/env node index.js index.js &>/dev/null
echo "[PASS] relative path" >&2
/usr/bin/env node index.js $PWD/index.js &>/dev/null
echo "[PASS] absolute path" >&2

FULL_SCRIPT_PATH="$PWD/index.js"
EXPECTED_VERSION_STRING="testproject" # somewhere in there
EXPECTED_GLOB_STRING="ran clang-format on 2 files"
EXPECTED_GLOB_IGNORE_STRING="ran clang-format on 1 file"

pushd $PWD/testproject
npm install &>/dev/null # Should give us a local clang-format, version doesn't really matter.
VERSION=`/usr/bin/env node $FULL_SCRIPT_PATH -version`
if [[ $VERSION != *"$EXPECTED_VERSION_STRING"* ]]; then
  echo "[FAIL] Expected string containing $EXPECTED_VERSION_STRING, got $VERSION" >&2
  exit 1
fi
echo "[PASS] no file argument uses working directory" >&2
popd

VERSION=`/usr/bin/env node $FULL_SCRIPT_PATH -version $PWD/testproject/lib/test.js`
if [[ $VERSION != *"$EXPECTED_VERSION_STRING"* ]]; then
  echo "[FAIL] Expected string containing $EXPECTED_VERSION_STRING, got $VERSION" >&2
  exit 1
fi
echo "[PASS] file argument anchors resolution" >&2

GLOB=`/usr/bin/env node $FULL_SCRIPT_PATH --glob=testproject/lib/**/*.js`
if [[ $GLOB != *"$EXPECTED_GLOB_STRING"* ]]; then
  echo "[FAIL] Expected string ending in $EXPECTED_GLOB_STRING, got $GLOB" >&2
  exit 1
fi
echo "[PASS] supports glob argument" >&2

GLOB=`/usr/bin/env node $FULL_SCRIPT_PATH --glob=testproject/lib/**/*.js --globIgnore=testproject/lib/**/*.ignore.js`
if [[ $GLOB != *"$EXPECTED_GLOB_IGNORE_STRING"* ]]; then
  echo "[FAIL] Expected string ending in $EXPECTED_GLOB_IGNORE_STRING, got $GLOB" >&2
  exit 1
fi
echo "[PASS] supports globIgnore argument" >&2
