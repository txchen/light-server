/**
 * light-server
 *
 * Serve, watch, exucute commands and live-reload, all in one.
 *
 * Copyright (c) 2015 by Tianxiang Chen
 */

var connect = require('connect')
  , serveStatic = require('serve-static')
  , morgan = require('morgan')
  , Watcher = require('./watcher')
  , exec = require('child_process').exec
  , spawn = require('child_process').spawn
  , os = require('os').type()

function LightServer(serveDir, watchedFiles, command, options) {
  this.serveDir = serveDir
  this.watchedFiles = watchedFiles
  this.command = command
  this.options = options
  if (os === 'Windows_NT') {
    this.shell = 'cmd'
    this.firstParam = '/c'
  } else {
    this.shell = 'bash'
    this.firstParam = '-c'
  }
}

LightServer.prototype.start = function() {
  var self = this
    , app = connect()

  app.use(morgan('dev'))
     .use(require('connect-inject')({
        snippet: '<script src="__lightserver__/reload-client.js"></script>'
      }))
     .use(serveStatic(self.serveDir))
     .listen(self.options.port, function() {
        console.log('serving directory "' + self.serveDir + '" as http')
        console.log('listening on http://localhost:' + self.options.port)
      })

  self.watch()
}

LightServer.prototype.watch = function() {
  var self = this
  var watcher = new Watcher(self.watchedFiles, self.options.interval)
  watcher.on('change', function(f) {
    if (self.executing) {
      return
    }

    self.executing = true
    console.log('* file: ' + f + ' changed')
    if (!self.command) {
      console.log('## trigger reload')
      self.executing = false
      return
    }

    console.log('## executing command: ' + self.command)
    p = spawn(self.shell, [self.firstParam, self.command], { stdio: 'inherit' })
    p.on('close', function (code) {
      if (code !== 0) {
        console.log('## ERROR: command exited with code ' + code);
      } else {
        console.log('## command exited without error')
        console.log('## trigger reload')
      }
      self.executing = false
    })
  })
}

module.exports = LightServer
