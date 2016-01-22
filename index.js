/**
 * light-server
 *
 * Serve, watch, exucute commands and live-reload, all in one.
 *
 * Copyright (c) 2015 by Tianxiang Chen
 */

var connect = require('connect')
var serveStatic = require('serve-static')
var http = require('http')
var morgan = require('morgan')
var injector = require('connect-injector')
var Watcher = require('./watcher')
var LR = require('./livereload')
var spawn = require('child_process').spawn
var os = require('os').type()
var proxy = require('./proxy')

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
  var _this = this
  if (!_this.serveDir && !_this.proxyUrl) {
    _this.watch()
    return
  }

  var app = connect()
  _this.lr = LR({
    log: _this.options.log
  })

  app.use(morgan('dev'))
  app.use(_this.lr.middleFunc)
  app.use(injector(
            function(req, res) {
              return res.getHeader('content-type') && res.getHeader('content-type').indexOf('text/html') !== -1
            },

            function(data, req, res, callback) {
              callback(null, data.toString().replace('</body>', '<script src="/__lightserver__/reload-client.js"></script></body>'))
            })
  )

  if (_this.serveDir) {
    app.use(serveStatic(_this.serveDir))
  }

  if (_this.proxyUrl) {
    app.use(proxy(_this.proxyUrl).middleFunc)
  }

  var server = http.createServer(app)
  server.listen(_this.options.port, _this.options.host, function() {
    console.log('light-server is listening at http://'  + _this.options.host + ':' + _this.options.port)
    if (_this.serveDir) {
      _this.options.log && console.log('  serving static dir: ' + _this.serveDir)
    }

    if (_this.proxyUrl) {
      _this.options.log && console.log('  when static file not found, proxy to ' + _this.proxyUrl)
    }

    _this.options.log && console.log()
    _this.lr.startWS(server) // websocket shares same port with http
    _this.watch()
  })
}

LightServer.prototype.watch = function() {
  var _this = this
  _this.watchExpressions.forEach(function(we) {
    var tokens = we.trim().split(/\s*#\s*/)
    var filesToWatch = tokens[0].trim().split(/\s*,\s*/)
    var commandToRun = tokens[1]
    var reloadOption = tokens[2]
    if (reloadOption !== 'reloadcss') {
      reloadOption = 'reload' // default value
    }

    _this.processWatchExp(filesToWatch, commandToRun, reloadOption)
  })
}

LightServer.prototype.processWatchExp = function(filesToWatch, commandToRun, reloadOption) {
  var _this = this
  var watcher = Watcher(filesToWatch, _this.options.interval)
  watcher.on('change', function(f) {
    if (watcher.executing) { return }

    watcher.executing = true
    _this.options.log && console.log('* file: ' + f + ' changed')
    if (!commandToRun) {
      if (_this.lr) {
        _this.lr.trigger(reloadOption, _this.options.delay)
      }

      watcher.executing = false
      return
    }

    _this.options.log && console.log('## executing command: ' + commandToRun)
    var start = new Date().getTime()
    p = spawn(_this.shell, [_this.firstParam, commandToRun], { stdio: 'inherit' })
    p.on('close', function(code) {
      if (code !== 0) {
        console.log('## ERROR: command ' + commandToRun + ' exited with code ' + code)
      } else {
        _this.options.log && console.log('## command succeeded in ' + (new Date().getTime() - start) + 'ms')
        if (_this.lr) {
          _this.lr.trigger(reloadOption, _this.options.delay)
        }
      }

      watcher.executing = false
    })
  })

  if (filesToWatch.length) {
    _this.options.log && console.log('light-server is watching these files: ' + filesToWatch.join(', '))
    _this.options.log && console.log('  when file changes,')
    if (commandToRun) {
      _this.options.log && console.log('  this command will be executed:      ' + commandToRun)
    }

    _this.options.log && console.log('  this event will be sent to browser: ' + reloadOption + '\n')
  }
}

module.exports = LightServer
