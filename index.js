/**
 * light-server
 *
 * Serve, watch, exucute commands and live-reload, all in one.
 *
 * Copyright (c) 2015 by Tianxiang Chen
 */

var connect = require('connect')
  , serveStatic = require('serve-static')
  , http = require('http')
  , morgan = require('morgan')
  , Watcher = require('./watcher')
  , lrmiddle = require('./lrmiddle')
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
  if (!self.serveDir) {
    self.watch()
    return
  }

  var app = connect()
  self.lr = new lrmiddle()

  app.use(morgan('dev'))
     .use(require('connect-inject')({
        snippet: '<script src="/__lightserver__/reload-client.js"></script>'
      }))
     .use(serveStatic(self.serveDir))
     .use(self.lr.middleFunc)

  var server = http.createServer(app)
  server.listen(self.options.port, function() {
    console.log('light-server is serving "' + self.serveDir +
      '" as http://localhost:' + self.options.port + '\n')
    self.lr.startWS(server) // websocket shares same port with http
    self.watch()
  })
}

LightServer.prototype.watch = function() {
  var self = this
  var watcher = new Watcher(self.watchedFiles, self.options.interval)
  watcher.on('change', function(f) {
    if (self.executing) { return }

    self.executing = true
    console.log('* file: ' + f + ' changed')
    if (!self.command) {
      if (self.lr) {
        console.log('## trigger reload')
        self.lr.triggerReload()
      }
      self.executing = false
      return
    }

    console.log('## executing command: ' + self.command)
    p = spawn(self.shell, [self.firstParam, self.command], { stdio: 'inherit' })
    p.on('close', function (code) {
      if (code !== 0) {
        console.log('## ERROR: command exited with code ' + code)
      } else {
        console.log('## command succeeded')
        if (self.lr) {
          console.log('## trigger reload')
          self.lr.triggerReload()
        }
      }
      self.executing = false
    })
  })

  if (self.watchedFiles.length) {
    console.log('light-server is watching these files: ' + self.watchedFiles.join(', '))
    if (self.command) {
      console.log('  and will run this command before live-reload: ' + self.command)
    }
  }
}

module.exports = LightServer
