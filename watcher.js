'use strict'

var fs = require('fs')
var glob = require('glob')
var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter

function Watcher(files, interval) {
  if (!(this instanceof Watcher)) return new Watcher(files, interval)
  var _this = this
  _this.interval = interval
  files.forEach(function (f) {
    _this.watch(f)
  })
}

inherits(Watcher, EventEmitter)

Watcher.prototype.watch = function (file) {
  var _this = this
  file = file.trim()
  if (~file.indexOf('*')) {
    glob(file, function (err, files) {
      files.forEach(function (file) {
        _this.watch(file)
      })
    })
  } else {
    fs.watchFile(file, { interval: _this.interval }, function (curr) {
      if (curr.isFile()) {
        _this.emit('change', file)
      }
    })
  }
}

module.exports = Watcher
