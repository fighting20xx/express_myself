/**
 * Created by seven on 2018/3/2.
 * fighting20xx@126.com
 */

'use strict'

var http = require('http');
var deprecate = require('depd')('express');

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
    }





};





















