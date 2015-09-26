'use strict'
var fs = require('fs')
var packageJson = JSON.parse(fs.readFileSync('package.json'))
var babelrcs = require('babelrc-v8')
var versions = Object.keys(babelrcs).map(function (ver) { return ver.split('.') })
var v8version = process.versions.v8.split('.')

function cmpVerStr(a, b) {
  for (var ii=0; ii < a.length; ++ii) {
    if (b[ii] == null || a[ii] > b[ii]) return -1
    if (a[ii] < b[ii]) return 1
  }
  return 0
}

versions.sort(cmpVerStr)

for (var ii=0; ii < versions.length; ++ii) {
  if (cmpVerStr(v8version, versions[ii]) <= 0) {
    module.exports = module.parent.require('./v8/' +
      packageJson['babel-autonode.main'].replace(/^src/, versions[ii].join('.')))
    break
  }
}
