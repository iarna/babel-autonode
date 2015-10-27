#!/usr/bin/env node
'use strict'
var path = require('path')
var Promise = require('bluebird')
var execFile = Promise.promisify(require('child_process').execFile)
var fs = Promise.promisifyAll(require('fs'))
var mkdirp = Promise.promisify(require('mkdirp'))
var babelrcs = require('babelrc-v8')

var srcDir = 'src'
var destDir = 'v8'


// ensure we're in a package root
fs.statAsync('package.json').catch(function (e) {
  console.error('babel-autonode: must be run from your package root, the folder with your package.json in it')
  console.error('(and you must HAVE a package.json =p)')
  process.exit(1)
}).then(function () {
  return fs.statAsync(srcDir).catch(function (e) {
    console.error('babel-autonode: no src folder, so nothing to compile')
    process.exit(1)
  })
}).then(function () {
  return getFiles(srcDir)
}).then(function (files) {
  var destFiles = []
  Object.keys(babelrcs).forEach(function (ver) {
    files.forEach(function (file) {
      destFiles.push({
        src: {
          info: file.info,
          name: path.join(srcDir, file.name),
        },
        ver: ver,
        dest: {
          name: path.join(destDir, ver, file.name)
        }
      })
    })
  })
  return Promise.all(destFiles.map(function (file) {
    return fs.statAsync(file.dest.name).then(function (info) {
      file.dest.info = info
      return file
    }).catch(function (er) {
      return file
    })
  }))
}).filter(function (file) {
  return ! file.dest.info || file.dest.info.mtime < file.src.info.mtime
}).each(function (file) {
  return mkdirp(path.dirname(file.dest.name)).then(function () {
    var args = ['--babelrc', path.relative(
        process.cwd(), require.resolve('babelrc-v8/babelrcs/'+babelrcs[file.ver])),
      file.src.name, '-o', file.dest.name]
    console.log("> babel", args.join(' ', args))
    return execFile('babel', args, {stdio: 'inherit'}).catch(function (er) {
      console.error("Error running babel: " + er.message)
      process.exit(1)
    })
  })
}).then(function (files) {
  if (files.length) console.log('> build complete')
})

function getFiles (top, subdir) {
  if (!subdir) subdir = ''
  var dir = path.join(top, subdir)
  return fs.readdirAsync(dir).catch(function (er) {
    console.error('Error reading directory ' + dir + ': ' + er.message)
    process.exit(1)
  }).map(function (file) {
    var fullName = path.join(subdir, file)
    var fullPath = path.join(dir, file)
    return fs.statAsync(fullPath).catch(function (er) {
      console.error('Error reading info on ' + fullName + ': ' + er.message)
      process.exit(1)
    }).then(function (info) {
      if (info.isDirectory()) return getFiles(top, fullName)
      if (/[.]js$/.test(file)) return [{name: fullName, info: info}]
      return []
    })
  }).reduce(function (a, b) { return a.concat(b) }, [])
}
