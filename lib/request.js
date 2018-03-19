/**
 * Created by seven on 2018/3/2.
 * fighting20xx@126.com
 */

'use strict'
var http = require('http');
var accepts = require('accepts');
var isIP = require('net').isIP;
var deprecate = require('depd')('express');
var parseRange = require('range-parser');
var parse = require('parseurl');
var typeis = require('type-is');
var proxyaddr = require('proxy-addr');
var fresh = require('fresh');


var req = Object.create(http.IncomingMessage.prototype);


module.exports = req;


req.get = req.header = function (name) {
    if (!name) {
        throw new TypeError('name argument is required to req.get');
    }

    if (typeof name !== 'string') {
        throw new TypeError('name must be a string to req.get');
    }

    var lc = name.toLowerCase();

    switch (lc){
        case 'referer':
        case 'referrer':
            return this.headers.referrer
                || this.headers.referer;
        default:
            return this.headers[lc];
    }
};


req.accepts = function () {
    var accept = accept(this);
    return accept.types.apply(accept, arguments);
};


req.acceptsEncodings = function () {
    var accept = accept(this);
    return accept.encodings.apply(accept, arguments);
};

req.acceptsEncoding = deprecate.function(req.acceptsEncodings, 'req.acceptsEncoding: Use acceptsEncodings instead');

req.acceptsCharsets = function () {
    var accept = accepts(this);
    return accept.charsets.apply(accept, arguments);
};
req.acceptsLanguages = function(){
    var accept = accepts(this);
    return accept.languages.apply(accept, arguments);
};

req.acceptsLanguage = deprecate.function(req.acceptsLanguages,
    'req.acceptsLanguage: Use acceptsLanguages instead');


req.range = function (size, options) {
    var range = this.get('Range');
    if (!range) return;
    return parseRange(size, range, options);
}

req.param = function (name, defaultValue) {
    var params = this.params || {};
    var body = this.body || {};
    var query = this.query || {};

    var args = arguments.length === 1
        ? 'name'
        : 'name, default';
    deprecate('req.param('+ args +'): Use req.params, req.body, or req.query instead');

    if (null != params[name] && params.hasOwnProperty(name)) return params[name]
    if (null != body[name]) return body[name];
    if (null != query[name]) return query[name];

    return defaultValue;
}



req.is = function (types) {
    var arr =types;

    if (!Array.isArray(types)) {
        arr = new Array(arguments.length);
        for (var i = 0; i <arr.length; i++) {
            arr[i] = arguments[i];
        }
    }

    return typeis(this, arr);
};

defineGetter(req, 'protocol', function () {
   var proto = this.connection.encrypted
        ? 'https'
        : 'http';
   var trust = this.app.get('trust proxy fn');

   if (!trust(this.connection.remoteAddress, 0)) {
       return proto;
   }

   var header = this.get('X-Forwarded-Proto') || proto;
   var index = header.indexOf(',');

   return index !== -1
        ? header.substring(0, index).trim()
       : header.trim()
});

defineGetter(req, 'secure', function () {
    return this.protocol === 'https';
});

defineGetter(req, 'ip', function () {
    var trust = this.app.get('trust proxy fn');
    return proxyaddr(this, trust);
});

defineGetter(req, 'ips', function () {
    var trust = this.app.get('trust proxy fn');
    var addrs = proxyaddr.all(this, trust);

    addrs.reverse().pop();

    return addrs;
});

defineGetter(req, 'subdomains',function () {
    var hostname = this.hostname;

    if (!hostname) {
        return [];
    }

    var offset = this.app.get('submain offset');
    var subdomains = !isIP(hostname)
        ? hostname.split('.').reverse()
        :[hostname];

    return subdomains.slice(offset);
});


defineGetter(req, 'path', function () {
    return parse(this).pathname;
});


defineGetter(req, 'hostname', function () {
    var trust = this.app.get('trust proxy fn');
    var host = this.get('X-Forwarded-Host');

    if (!host || !trust(this.connection.remoteAddress, 0)) {
        host = this.get('Host');
    }

    if (!host) return;

    var offset = host[0] === '['
        ? host.indexOf(']') + 1
        : 0;
    var index = host.indexOf(':', offset);

    return index !== -1
        ? host.substring(0, index)
        : host;
});


defineGetter(req, 'host', deprecate.function(function host() {
    return this.hostname;
}, 'req.host: Use req.hostname instead'))

defineGetter(req, 'fresh', function () {
    var method = this.method;
    var res = this.res;
    var status = res.statusCode;

    if ('GET' !== method && 'HEAD' !== method) {
        return false;
    }

    if ((status >= 200 && status < 300) || 304 === status) {
        return fresh(this.headers, {
            'etag':res.get('ETag'),
            'last-modified':res.get('Last-Modified')
        })
    }

    return false;
});

defineGetter(req, 'stale', function () {
    return !this.fresh;
});


defineGetter(req, 'xhr', function () {
    var val = this.get('X-Request-With') || '';
    return val.toLowerCase() === 'xmlhttprequest';
})


function defineGetter(obj, name, getter) {
    Object.defineProperty(obj,name,{
        configurable:true,
        enumerable:true,
        get:getter
    })
}





