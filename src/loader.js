'use strict'
const packageJson = module.parent.require('./package.json')
const babelrcs = require('babelrc-v8')
const versions = Object.keys(babelrcs).map(function (ver) { return ver.split('.') })
const v8version = process.versions.v8.split('.')

function cmpVerStr(a, b) {
  for (let ii=0; ii < a.length; ++ii) {
    if (b[ii] == null || a[ii] > b[ii]) return -1
    if (a[ii] < b[ii]) return 1
  }
  return 0
}

versions.sort(cmpVerStr)

for (let ii=0; ii < versions.length; ++ii) {
  if (cmpVerStr(v8version, versions[ii]) <= 0) {
    module.exports = module.parent.require('./v8/' +
      packageJson['babel-autonode.main'].replace(/^src/, versions[ii].join('.')))
    break
  }
}
