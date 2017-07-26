'use strict'

var httpProxy = require('http-proxy')
var _this = this

function Proxy (target, path) {
  if (!(this instanceof Proxy)) return new Proxy(target, path)
  _this.proxyTarget = target
  _this.proxyPath = path
  _this.proxy = httpProxy.createProxyServer({ changeOrigin: true })
}

Proxy.prototype.middleFunc = function (req, res, next) {
  if (!req.url.startsWith(_this.proxyPath)) {
    return next()
  }
  _this.proxy.web(req, res, { target: _this.proxyTarget }, function (err, req, res) {
    console.error('failed to connect to proxy: ' + _this.proxyTarget + ' - ' + err.message)
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    })
    res.end(err.stack)
  })
}

module.exports = Proxy
