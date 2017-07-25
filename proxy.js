'use strict'

var httpProxy = require('http-proxy')
var _this = this

function Proxy(url) {
  if (!(this instanceof Proxy)) return new Proxy(url)
  _this.proxyUrl = url
  _this.proxy = httpProxy.createProxyServer({ changeOrigin: true })
}

Proxy.prototype.middleFunc = function livereload(req, res, next) {
  _this.proxy.web(req, res, { target: _this.proxyUrl }, function (err, req, res) {
    console.error('failed to connect to proxy: ' + _this.proxyUrl + ' - ' + err.message)
    res.writeHead(500, {
      'Content-Type': 'text/plain',
    })
    res.end(err.stack)
  })
}

module.exports = Proxy
