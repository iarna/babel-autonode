#!/usr/bin/env node
'use strict'
const path = require('path')
const Promise = require('bluebird')
const execFile = Promise.promisify(require('child_process').execFile)
const fs = Promise.promisifyAll(require('fs'))
const mkdirp = Promise.promisify(require('mkdirp'))
const babelrcs = require('babelrc-v8')

const srcDir = 'src'
const destDir = 'v8'


// ensure we're in a package root
fs.statAsync('package.json').catch(() => {
  console.error('babel-autonode: must be run from your package root, the folder with your package.json in it')
  console.error('(and you must HAVE a package.json =p)')
  process.exit(1)
}).then(() => {
  return fs.statAsync(srcDir).catch(() => {
    console.error('babel-autonode: no src folder, so nothing to compile')
    process.exit(1)
  })
}).then(() => getFiles(srcDir)).then(files => {
  const destFiles = []
  Object.keys(babelrcs).forEach(ver => {
    files.forEach(file => {
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
  return Promise.all(destFiles.map(file =>
    fs.statAsync(file.dest.name).then(info => {
      file.dest.info = info
      return file
    }).catch(() => file)))
}).filter(file => !file.dest.info || file.dest.info.mtime < file.src.info.mtime).each(file => {
  return mkdirp(path.dirname(file.dest.name)).then(() => {
    const args = ['--babelrc', path.relative(
        process.cwd(), require.resolve('babelrc-v8/babelrcs/'+babelrcs[file.ver])),
      file.src.name, '-o', file.dest.name]
    console.log("> babel", args.join(' ', args))
    return execFile('babel', args, {stdio: 'inherit'}).catch(er => {
      console.error("Error running babel: " + er.message)
      process.exit(1)
    })
  })
}).then(files => files.length && console.log('> build complete'))

function getFiles (top, subdir) {
  if (!subdir) subdir = ''
  const dir = path.join(top, subdir)
  return fs.readdirAsync(dir).catch(er => {
    console.error('Error reading directory ' + dir + ': ' + er.message)
    process.exit(1)
  }).map(file => {
    const fullName = path.join(subdir, file)
    const fullPath = path.join(dir, file)
    return fs.statAsync(fullPath).catch(er => {
      console.error('Error reading info on ' + fullName + ': ' + er.message)
      process.exit(1)
    }).then(info => {
      if (info.isDirectory()) return getFiles(top, fullName)
      if (/[.]js$/.test(file)) return [{name: fullName, info: info}]
      return []
    })
  }).reduce((a, b) => a.concat(b), [])
}
