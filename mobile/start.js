#!/usr/bin/env node
const path = require('path');
process.chdir(__dirname);
// Pass 'start' argument if none given
if (process.argv.length <= 2) {
  process.argv.push('start');
}
require('@expo/cli/build/bin/cli');
