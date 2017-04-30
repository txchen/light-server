/**
 * light-server
 *
 * Serve, watch, exucute commands and live-reload, all in one.
 *
 * Copyright (c) 2017 by Tianxiang Chen
 */
'use strict'

var connect = require('connect')
var serveStatic = require('serve-static')
var morgan = require('morgan')
var injector = require('connect-injector')
var Watcher = require('./watcher')
var LR = require('./livereload')
var spawn = require('child_process').spawn
var os = require('os').type()
var proxy = require('./proxy')

function LightServer(options) {
  if (!(this instanceof LightServer)) return new LightServer(options)
  this.options = options
  if (os === 'Windows_NT') {
    this.shell = 'cmd'
    this.firstParam = '/c'
  } else {
    this.shell = 'bash'
    this.firstParam = '-c'
  }
}

LightServer.prototype.writeLog = function (logLine) {
  !this.options.quiet && console.log(logLine)
}

LightServer.prototype.start = function () {
  var _this = this
  if (!_this.options.serve && !_this.options.proxy) {
    _this.watch()
    return
  }

  var app = connect()
  _this.lr = LR({
    quiet: _this.options.quiet,
    http2: _this.options.http2,
  })

  !this.options.quiet && app.use(morgan('dev'))
  app.use(_this.lr.middleFunc)
  app.use(injector(
    function (req, res) {
      return res.getHeader('content-type') && res.getHeader('content-type').indexOf('text/html') !== -1
    },

    function (data, req, res, callback) {
      callback(null, data.toString().replace('</body>', '<script src="/__lightserver__/reload-client.js"></script></body>'))
    })
  )

  if (_this.options.serve) {
    app.use(serveStatic(_this.options.serve))
  }

  if (_this.options.proxy) {
    app.use(proxy(_this.options.proxy).middleFunc)
  }

  if (_this.options.http2) {
    var fs = require('fs')
    var path = require('path')
    console.log(__dirname)
    var server = require('spdy').createServer({
      key: fs.readFileSync(path.join(__dirname, '/localhost.key')),
      cert: fs.readFileSync(path.join(__dirname, '/localhost.crt')),
    }, app)
  } else {
    var server = require('http').createServer(app)
  }

  server.listen(_this.options.port, _this.options.bind, function () {
    console.log('light-server is listening at ' + (_this.options.http2 ? 'https://' : 'http://') + (_this.options.bind || '0.0.0.0') + ':' + _this.options.port)
    if (_this.options.serve) {
      _this.writeLog('  serving static dir: ' + _this.options.serve)
    }

    if (_this.options.proxy) {
      _this.writeLog('  when static file not found, proxy to ' + _this.options.proxy)
    }

    _this.writeLog('')
    _this.lr.startWS(server) // websocket shares same port with http
    _this.watch()
  }).on('error', function (err) {
    if (err.errno === 'EADDRINUSE') {
      console.log('## ERROR: port ' + _this.options.port + ' is already in use')
      process.exit(2)
    } else {
      console.log(err)
    }
  })
}

LightServer.prototype.watch = function () {
  var _this = this
  _this.options.watchexps.forEach(function (we) {
    var tokens = we.trim().split(/\s*#\s*/)
    var filesToWatch = tokens[0].trim().split(/\s*,\s*/)
    var commandToRun = tokens[1]
    var reloadOption = tokens[2]
    if (reloadOption !== 'reloadcss' && reloadOption !== 'no-reload') {
      reloadOption = 'reload' // default value
    }

    _this.processWatchExp(filesToWatch, commandToRun, reloadOption)
  })
}

LightServer.prototype.processWatchExp = function (filesToWatch, commandToRun, reloadOption) {
  var _this = this
  var watcher = Watcher(filesToWatch, _this.options.interval)
  watcher.on('change', function (f) {
    if (watcher.executing) { return }

    watcher.executing = true
    _this.writeLog('* file: ' + f + ' changed')
    if (!commandToRun) {
      if (_this.lr) {
        _this.lr.trigger(reloadOption, _this.options.delay)
      }

      watcher.executing = false
      return
    }

    console.log('## executing command: ' + commandToRun)
    var start = new Date().getTime()
    var p = spawn(_this.shell, [_this.firstParam, commandToRun], { stdio: 'inherit' })
    p.on('close', function (code) {
      if (code !== 0) {
        console.log('## ERROR: command ' + commandToRun + ' exited with code ' + code)
      } else {
        _this.writeLog('## command succeeded in ' + (new Date().getTime() - start) + 'ms')
        if (_this.lr) {
          _this.lr.trigger(reloadOption, _this.options.delay)
        }
      }

      watcher.executing = false
    })
  })

  if (filesToWatch.length) {
    _this.writeLog('light-server is watching these files: ' + filesToWatch.join(', '))
    _this.writeLog('  when file changes,')
    if (commandToRun) {
      _this.writeLog('  this command will be executed:      ' + commandToRun)
    }

    _this.writeLog('  this event will be sent to browser: ' + reloadOption + '\n')
  }
}

module.exports = LightServer
