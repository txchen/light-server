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

function LightServer(serveDir, options) {
  var self = this
  self.serveDir = serveDir
  self.port = parseInt(options.port) || 4000
}

LightServer.prototype.start = function() {
  var self = this
    , app = connect()

  app.use(morgan('dev'))
     .use(require('connect-inject')({
       snippet: '<script src="__lightserver__/reload-client.js"></script>'
      }))
     .use(serveStatic(self.serveDir))
     .listen(self.port, function() {
       console.log('listening on http://localhost:' + self.port)
     })
}

module.exports = LightServer
