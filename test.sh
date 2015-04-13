#!/bin/sh
set -e

EXPECTED='(x): number => 123\n'
ACTUAL=`echo '(  \n x ) : number  =>   123  ' | /usr/bin/env node index.js -assume-filename a.js`
if [[ "$ACTUAL" = "$EXPECTED" ]]; then
  echo "Expected $EXPECTED, got $ACTUAL" >&2
  exit 1
fi

# Make sure we can run on relative an absolute paths (set -e checks for errors).
/usr/bin/env node index.js index.js &>/dev/null
/usr/bin/env node index.js $PWD/index.js &>/dev/null
