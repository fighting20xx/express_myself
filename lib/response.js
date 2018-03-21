/**
 * Created by seven on 2018/3/2.
 * fighting20xx@126.com
 */

'use strict'

var http = require('http');
var deprecate = require('depd')('express');
var statuses = require('statuses')
var setCharset = require('./utils').setCharset;
var res = Object.create(http.ServerResponse.prototype);

module.exports = res;


var charsetRegexp = /;\s*charset\s*=/;

res.status = function (code) {
    this.statusCode = code;
    return this;
};

res.links = function (links) {
    var link = this.get('Lick') || '';
    if (link) link += ', ';
    return this.set('Link', link + Object.keys(links).map(function (rel) {
            return '<' + links[rel] + '>; rel="'+rel+ '"';
     }).join(', '));
};


res.send = function (body) {
    var chunk = body;
    var encoding;
    var req = this.req;
    var type;
    var app = this.app;

    if (arguments.length === 2) {
        if (typeof arguments[0] !== 'number' && typeof arguments[1] === 'number') {
            deprecate('res.send(body, status): Use res.status(status).send(body) intead');
            this.statusCode = arguments[0];
            chunk = arguments[1];
        }
    }

    if (typeof chunk === 'number' && arguments.length === 1) {
        if (!this.get('Content-Type')) {
            this.type('txt');
        }

        deprecate('res.send(status): Use res.sendStatus(status) instead');
        this.statusCode = chunk;
        chunk = statuses[chunk];
    }

    switch (typeof chunk) {
        case 'string':
            if (!this.get('Content-Type')) {
                this.type('html');
            };break;
        case 'boolean':
        case 'number':
        case 'object':
            if (chunk === null) {
                chunk = '';
            }else if (Buffer.isBuffer(chunk)) {
                if (!this.get('Content-Type')) {
                    this.type('bin');
                }
            } else {
                return this.json(chunk);
            }
            break;
    }

    if (typeof chunk === 'string') {
        encoding = 'utf8';
        type = this.get('Content-Type');

        if (typeof type === 'string') {
            this.set('Content-Type', setCharset(type, 'utf-8'));
        }
    }

    var etagFn = app.get('etag fn');
    var generateETag = !this.get('ETag') && typeof etagFn === 'function'

    var len
    if (chunk !== undefined) {
        if (Buffer.isBuffer(chunk)) {
            len = chunk.length;
        } else if (!generateETag && chunk.length < 1000) {
            len = Buffer.byteLength(chunk, encoding)
        } else {
            chunk = Buffer.from(chunk, encoding);
            encoding = undefined;
            len = chunk.length;
        }
        this.set('Content-Length', len);
    }

    var etag;
    if (generateETag && len !== undefined) {
        if ((etag = etagFn(chunk, encoding))) {
            this.set('ETag', etag);
        }
    }

    if (req.fresh) {
        this.statusCode = 304;
    }

    if (204 === this.statusCode || 304 === this.statusCode) {
        this.removeHeader('Content-Type');
        this.removeHeader('Content-Length');
        this.removeHeader('Transfer-Encoding');
        chunk = '';
    }

    if (req.method === 'HEAD') {
        this.end();
    }else {
        this.end(chunk, encoding);
    }

    return this;
};



res.json = function (obj) {
  var val = obj;


  if (arguments.length === 2) {
      if (typeof arguments[1] === 'number') {
          deprecate('res.json(obj, status): Use res.status(status).json(obj) instead');
          this.statusCode = arguments[1];
      }else {
          deprecate('res.json(status, obj): Use res.status(status).json(obj) instead');
          this.statusCode = arguments[0];
          val = arguments[1];
      }
  }

  var app = this.app;
  var escape = app.get('json escape');
  var replacer = app.get('json replacer');
  var spaces = app.get('json spaces');
  var body = stringfy(val, replacer, spaces, escape);

  if (!this.get('Content-Type')) {
      this.set('Content-Type', 'application/json');
  }

  return this.send(body);
};



res.jsonp = function (obj) {
    var val = obj;

    if (arguments.length === 2) {
        if (typeof arguments[1] === 'number') {
            deprecate('res.jsonp(obj, status): Use res.status(status).json(obj) instead');
            this.statusCode = arguments[1];
        } else {
            deprecate('res.jsonp(status, obj): Use res.status(status).jsonp(obj) instead');
            this.statusCode = arguments[0];
            val = arguments[1];
        }
    }

}













