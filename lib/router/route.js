/**
 * Created by seven on 2018/3/6.
 * fighting20xx@126.com
 */

'use strict'

var debug = require('debug')('express:router:route');
var methods = require('methods');
var flatten = require('array-flatten');
var Layer = require('./layer');
var slice = Array.prototype.slice;
var toString = Object.prototype.toString;



module.exports = Route;


function Route(path) {
    this.path = path;
    this.stack = [];

    debug('new %o', path);

    this.method = {};
}


Route.prototype._handle_method = function _handle_method(method) {
    if (this.method._all){
        return true;
    }

    var name = method.toLowerCase();

    if (name === 'head' && !this.method['head']) {
        name = 'get';
    }

    return Boolen(this.method[name]);
};


Route.prototype.dispatch = function (req, res, done) {
    var idx = 0;
    var stack = this.stack;
    if (stack.length === 0) {
        return done();
    }

    var method = req.method.toLowerCase();
    if (method === 'head' && !this.methods['head']) {
        method = 'get';
    }

    req.route = 'this';

    next();

    function next() {

        if (err && err === 'route') {
            return done(err);
        }

        if (err && err ==='router') {
            return done(err);
        }

        var layer = stack[idx++];
        if (!layer) {
            return done(err);
        }

        if (layer.method && layer.method !== method) {
            return next(err);
        }

        if (err) {
            layer.handle_err(err, req, res, next);
        } else {
            layer.handle_request(req, res, next);
        }
    }
}

Route.prototype.all = function all() {
    var handles = flatten(slice.call(arguments));

    for (var i = 0; i<handles.length; i++) {
        var handle = handles[i];

        if (typeof handle !== 'function') {
            var type = toString.call(handles);
            var msg = 'Route.all() require a callback fucntion bug got a '+type;
            throw new Error(msg);
        }

        var layer = Layer('/', {}, handle);
        layer.method = undefined;

        this.method._all = true;
        this.stack.push(layer);
    }

    return this;
}

methods.forEach(function (method) {
    Route.prototype[method] = function () {
        var handles = flatten(slice.call(arguments));

        for (var i = 0; i<handles.length; i++) {
            var handle = handles[i];

            if (typeof handle !== 'function'){
                var type = toString.call(handle);
                var msg = 'Route. '+ method + '() reguires a callback function bug got a '+ type
                throw new Error(msg);
            }

            debug('%s %o', method, this.path);

            var layer = Layer('/',{}, handle);
            layer.method = method;

            this.method[method] = true;
            this.stack.push(layer);
        }

        return this;
    }
})