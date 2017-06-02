'use strict'

var httpProxy = require('http-proxy')
var _this = this

function Proxy(_opt) {
  if (!(this instanceof Proxy)) return new Proxy(_opt)
  if(typeof _opt == "string"){
    _this.proxyUrl = _opt;
    _this.options = {
      target:_this.proxUrl,
      changeOrigin: true
    };
  }else{
    _this._proxyUrl = _opt.target;
    _this.options = _opt;
  }
  _this.proxy = httpProxy.createProxyServer(_this.options)
}

Proxy.prototype.middleFunc = function livereload(req, res, next) {
  _this.proxy.web(req, res, _this.options)
}

module.exports = Proxy
