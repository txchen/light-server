var fs = require('fs')
  , glob = require('glob')
  , inherits = require('util').inherits
  , EventEmitter = require('events').EventEmitter

function Watcher(files, interval) {
  if (!(this instanceof Watcher)) return new Watcher(files, interval)
  var self = this
  self.interval = interval
  files.forEach(function(f) {
    self.watch(f)
  })
}

inherits(Watcher, EventEmitter)

Watcher.prototype.watch = function(file) {
  var self = this
  if (~file.indexOf('*')) {
    glob(file, function(err, files) {
      files.forEach(function(file) {
        self.watch(file)
      })
    })
  } else {
    fs.watchFile(file, {interval: self.interval}, function() {
      self.emit('change', file)
    })
  }
}

module.exports = Watcher
