var httpProxy = require('http-proxy')

var self = this

function proxy(url) {
  self.proxyUrl = url
  self.proxy = httpProxy.createProxyServer({})
}

proxy.prototype.middleFunc = function livereload(req, res, next) {
  self.proxy.web(req, res, { target: self.proxyUrl })
}

module.exports = proxy
