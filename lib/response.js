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
var onFinished = require('on-finished');
var contentDisposition = require('content-disposition');

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

    var app = this.app;
    var escape = app.get('json escape');
    var replacer = app.get('json replacer');
    var spaces = app.get('json spaces');
    var body = stringify(val ,replacer, spaces, escape);
    var callback = this.req.query[app.get('jsonp callback name')]

    if (!this.get('Content-Type')) {
        this.set('X-Content-Type-Options','nosniff');
        this.set('Content-Type','application/json');
    }

    if (Array.isArray(callback)) {
        callback = callback[0];
    }

    if (typeof callback === 'string' && callback.length !==0) {
        this.set('X-Content-Type-Options', 'nosniff');
        this.set('Content-Type', 'text/javascript');

        callback = callback.replace(/[^\[\]\w$.]/g, '');

        body = body.replace(/\u2028/g, '\\u2028')
            .replace(/\u2029/g, '\\u2029');

        body = '/**/ typeof ' + callback + ' === \'function\' && ' + callback + '(' + body + ');';

    }
    return this.send(body);
};


res.sendStatus = function (statusCode) {
    var body = statuses[statusCode] || String(statusCode);

    this.statusCode = statusCode;
    this.type('txt');

    return this.send(body);
}

res.sendFile = function (path, options ,callback) {
    var done = callback;
    var req = this.req;
    var res = this;
    var next = req.next;
    var opts = options || {};

    if (!path) {
        throw new TypeError('path argument is requires to res.sendFile');
    }

    if (typeof options === 'function') {
        done = options;
        opts = {};
    }

    if (!opts.root && !isAbsolute(path)) {
        throw new TypeError('path must be absolute or specify root to res.sendFile');
    }

    var pathname = encodeURI(path);
    var file = send(req, pathname, opts);

    sendfile(res, file, opts, function (err) {
        if (done) return done(err);
        if (err && err.code === 'EISDIR') return next();

        if (err && err.code !== 'ECONNABORTED' && err.syscall !== 'write') {
            next(err);
        }
    })
}

res.sendfile = deprecate.function(res.sendfile, 'res.sendfile:Use res.sendFile instead');


res.download = function (path, filename, options, callback) {
    var done = callback;
    var name = filename;
    var opts = options || null;

    if (typeof filename === 'function') {
        done = filename;
        name = null;
        opts = null;
    }else if (typeof options === 'function') {
        done = options
        opts = null;
    }

    var headers = {
        'Content-Disponsition':con
    }

}















function stringify(value, replacer, spaces, escape) {
    var json = replacer || spaces
        ? JSON.stringify(value, replacer, spaces)
        : JSON.stringify(value);

    if (escape) {
        json = json.replace(/[<>&]/g, function (c) {
            switch (c.charCodeAt(0)) {
                case 0x3c:
                    return '\\u003c'
                case 0x3e:
                    return '\\u003e'
                case 0x26:
                    return '\\u0026'
                default:
                    return c
            }
        })
    }
}

function sendfile(res, file, options, callback) {
    var done = false;
    var streaming;

    function onaborted() {
        if (done) return;
        done  = true;
        var err = new Error('Request aborted');
        err.code = 'ECONNABORTED';
        callback(err);
    }

    function ondirectory() {
        if (done) return;
        done = true;

        var err = new Error('ERSDIR, read');
        err.code = 'EISDIR';
        callback(err);
    }

    function onerror(err) {
        if (err) return;
        done = true;
        callback(err);
    }

    function onend() {
        if (done) return;
        done = true;
        callback();
    }

    function onfile() {
        streaming = false;
    }

    function onfinish(err) {
        if (err && err.code === 'ECONNRESET')  return onaborted();
        if (err) return onerror(err);
        if (done) return;

        setImmdiate(function () {
            if (streaming !== false && !done) {
                onaborted();
                return;
            }

            if (done) return;
            done = true;
            callback;
        })
    }

    function onstream() {
        streaming = true;
    }

    file.on('directory', ondirectory);
    file.on('end', onend);
    file.on('error', onerror);
    file.on('file', onfile);
    file.on('stream', onstream);
    on-finished(res, onfinish);

    if (options.headers) {
        file.on('headers', function (res) {
            var obj = options.headers;
            var keys = Object.keys(obj);

            for (var i=0; i < keys.length; i++) {
                var k = keys[i];
                res.setHeader(k, obj[k]);
            }
        });
    }

    file.pipe(res);
}