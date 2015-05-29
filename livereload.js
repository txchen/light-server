var parseUrl = require('parseurl')
  , inherits = require('util').inherits
  , WS = require('ws').Server
  , EventEmitter = require('events').EventEmitter
  , prefix = '/__lightserver__'
  , clientJsPath = prefix + '/reload-client.js'
  , triggerPath = prefix + '/trigger'
  , triggerCSSPath = prefix + '/triggercss'

var clientJsContent = [
'var ws',
'function socket() {',
'  ws = new WebSocket("ws://" + window.location.host)',
'  ws.onmessage = function (e) {',
'    var data = JSON.parse(e.data)',
'    if (data.r) {',
'      location.reload()',
'    }',
'    if (data.rcss) {',
'      refreshCSS()',
'    }',
'  }',
'}',
'function refreshCSS() {',
'  console.log("reload css at:" + new Date())',
'  var sheets = document.getElementsByTagName("link");',
'  for (var i = 0; i < sheets.length; i++) {',
'    var elem = sheets[i];',
'    var rel = elem.rel;',
'    if (elem.href && typeof rel != "string" || rel.length == 0 || rel.toLowerCase() == "stylesheet") {',
'      var url = elem.href.replace(/(&|\\?)_cacheOverride=\\d+/, "");',
'      elem.href = url + (url.indexOf("?") >= 0 ? "&" : "?") + "_cacheOverride=" + (new Date().valueOf());',
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
  , wsArray = []

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

  if (pathname == triggerCSSPath) {
    res.writeHead(200)
    res.end('ok')
    emitter.emit('reloadcss')
  }

  next()
}

livereload.prototype.startWS = function(server) {
  wss = new WS({server: server})

  wss.on('connection', function (ws) {
    wsArray.push(ws)
    ws.on('close', function () {
      var index = wsArray.indexOf(ws)
      if (index > -1) {
        wsArray.splice(index, 1);
      }
    })
  })

  emitter.on('reload', function () {
    console.log("## send reload event via websocket to browser")
    wsArray.forEach(function (w) {
      w.send(JSON.stringify({r: Date.now().toString()}), function (e) {
        if (e) { console.log("websocket send error: " + e) }
      })
    })
  })

  emitter.on('reloadcss', function () {
    console.log("## send reloadcss event via websocket to browser")
    wsArray.forEach(function (w) {
      w.send(JSON.stringify({rcss: Date.now().toString()}), function (e) {
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

livereload.prototype.triggerCSSReload = function(delay) {
  if (delay) {
    console.log('delay reloadcss for ' + delay + ' ms')
  }
  setTimeout(function() {
    emitter.emit('reloadcss')
  }, delay)
}

livereload.prototype.trigger = function(action, delay) {
  if (action === 'reloadcss') {
    this.triggerCSSReload(delay)
  } else {
    this.triggerReload(delay)
  }
}

module.exports = livereload
