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
  , LR = require('./livereload')
  , spawn = require('child_process').spawn
  , os = require('os').type()
  , proxy = require('./proxy')

function LightServer(serveDir, watchExpressions, proxyUrl, options) {
  if (!(this instanceof LightServer)) return new LightServer(serveDir, watchExpressions, proxyUrl, options)
  this.serveDir = serveDir
  this.watchExpressions = watchExpressions
  this.proxyUrl = proxyUrl
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
  self.lr = LR()

  app.use(morgan('dev'))
     .use(require('connect-inject')({
        snippet: '<script src="/__lightserver__/reload-client.js"></script>'
      }))
     .use(serveStatic(self.serveDir))
     .use(self.lr.middleFunc)

  if (self.proxyUrl) {
    app.use(proxy(self.proxyUrl).middleFunc)
  }

  var server = http.createServer(app)
  server.listen(self.options.port, function() {
    console.log('light-server is serving directory "' + self.serveDir +
      '" as http://localhost:' + self.options.port)
    if (self.proxyUrl) {
      console.log('  when static file not found, proxy to ' + self.proxyUrl)
    }
    console.log()
    self.lr.startWS(server) // websocket shares same port with http
    self.watch()
  })
}

LightServer.prototype.watch = function() {
  var self = this
  self.watchExpressions.forEach(function (we) {
    var tokens = we.trim().split(/\s*#\s*/)
    var filesToWatch = tokens[0].trim().split(/\s*,\s*/)
    var commandToRun = tokens[1]
    var reloadOption = tokens[2]
    if (reloadOption !== 'reloadcss') {
      reloadOption = 'reload' // default value
    }
    self.processWatchExp(filesToWatch, commandToRun, reloadOption)
  })
}

LightServer.prototype.processWatchExp = function(filesToWatch, commandToRun, reloadOption) {
  var self = this
  var watcher = Watcher(filesToWatch, self.options.interval)
  watcher.on('change', function(f) {
    if (watcher.executing) { return }

    watcher.executing = true
    console.log('* file: ' + f + ' changed')
    if (!commandToRun) {
      if (self.lr) {
        self.lr.trigger(reloadOption, self.options.delay)
      }
      watcher.executing = false
      return
    }

    console.log('## executing command: ' + commandToRun)
    var start = new Date().getTime();
    p = spawn(self.shell, [self.firstParam, commandToRun], { stdio: 'inherit' })
    p.on('close', function (code) {
      if (code !== 0) {
        console.log('## ERROR: command exited with code ' + code)
      } else {
        console.log('## command succeeded in ' + (new Date().getTime() - start) + 'ms')
        if (self.lr) {
          self.lr.trigger(reloadOption, self.options.delay)
        }
      }
      watcher.executing = false
    })
  })

  if (filesToWatch.length) {
    console.log('light-server is watching these files: ' + filesToWatch.join(', '))
    console.log('  when file changes,')
    if (commandToRun) {
      console.log('  this command will be executed:      ' + commandToRun)
    }
    console.log('  this event will be sent to browser: ' + reloadOption + '\n')
  }
}

module.exports = LightServer
