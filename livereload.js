var parseUrl = require('parseurl')
  , inherits = require('util').inherits
  , WS = require('ws').Server
  , EventEmitter = require('events').EventEmitter
  , prefix = '/__lightserver__'
  , clientJsPath = prefix + '/reload-client.js'
  , triggerPath = prefix + '/trigger'

var clientJsContent = [
'var ws',
'function socket() {',
'  ws = new WebSocket("ws://" + window.location.host)',
'  ws.onmessage = function (e) {',
'    var data = JSON.parse(e.data)',
'    if (data.r) {',
'      location.reload()',
'    }',
'  }',
'}',
'socket()',
'setInterval(function () {',
'  if (ws) {',
'    if (ws.readyState !== 1) {',
'      socket()',
'    }',
'  } else {',
'    socket()',
'  }',
'}, 3000)'
].join('\n')

var emitter = new EventEmitter
  , wss

function livereload() {
  if (!(this instanceof livereload)) return new livereload()
}

livereload.prototype.middleFunc = function livereload(req, res, next) {
  var pathname = parseUrl(req).pathname
  if (parseUrl(req).pathname.indexOf(prefix) == -1) {
    next()
    return
  }

  if (req.method == 'GET' && pathname == clientJsPath) {
    res.writeHead(200)
    res.end(clientJsContent)
    return
  }

  if (pathname == triggerPath) {
    res.writeHead(200)
    res.end('ok')
    emitter.emit('reload')
    return
  }

  next()
}

livereload.prototype.startWS = function(server) {
  wss = new WS({server: server})

  wss.on('connection', function (ws) {
    emitter.once('reload', function () {
      ws.send(JSON.stringify({r: Date.now().toString()}), function (e) {
        if (e) { console.log("websocket send error: " + e) }
      })
    })
  })
}

livereload.prototype.triggerReload = function(delay) {
  if (delay) {
    console.log('delay reload for ' + delay + ' ms')
  }
  setTimeout(function() {
    emitter.emit('reload')
  }, delay)
}

module.exports = livereload
