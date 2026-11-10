#!/bin/sh
# This Mac's default node (v11) and npm (v6) are too old for this project.
# Runs npm 10 on Homebrew's Node 24 without touching the global setup.
# On a machine with Node 22.12+ on the PATH, use plain npm instead.
export PATH="/usr/local/opt/node@24/bin:$PATH"
exec node /usr/local/n/versions/node/22.1.0/lib/node_modules/npm/bin/npm-cli.js "$@"
