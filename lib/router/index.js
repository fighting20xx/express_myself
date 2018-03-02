/**
 * Created by seven on 2018/3/2.
 * fighting20xx@126.com
 */

'use strict'

var methods = require('methods');
var debug = require('debug')('express:router');

var objectRegExp = /^\[object (\S+)\]$/;
var toString = Object.prototype.toString;


var  proto = module.exports = function (options) {
    var opts = options || {};

    function router(req ,res, next) {
        router.handle(req,res,next);
    }
    router.prototype = proto;
    router.params = {};
    router._params = [];
    router.caseSensitive = opt.caseSensitive;
    router.mergeParams = opt.mergeParams;
    router.strict = opts.strict;
    router.stack = [];

    return router;
};


proto.handle = function handle(req,res,out) {

};


proto.use = function use(fn) {
    var offset = 0;
    var path = '/';

    // default path to '/'
    // disambiguate router.use([fn])
    if (typeof fn !== 'function') {
        var arg = fn;

        while (Array.isArray(arg) && arg.length !== 0) {
            arg = arg[0];
        }

        // first arg is the path
        if (typeof arg !== 'function') {
            offset = 1;
            path = fn;
        }
    }
    var callbacks = flatten(slice,call(arguments,offset));

    if (callbacks.length === 0) {
        throw new TypeError('route.use函数 必须是要给中间件函数');
    }

    for (var i = 0; i < callbacks.length; i++){
        var fn = callbacks[i];

        if (typeof fn !== 'function') {
            throw TypeError('route.use添加中间件， 后面的必须是函数类型，但是得到的却是'+gettype(fn));
        }

        debug('use %o %s',path,fn.name || '<anonymous>');

        var layer = new Layer(path, {
            sensitive:this.caseSensitive,
            strict:false,
            end:false
        }, fn);

        layer.route = undefined;

        this.stack.push(layer);
    }

    return this;
};
proto.route = function route() {

};

methods.concat('all').forEach(function (method) {
   proto[method] = function (path) {
       var route = this.route(path);
       route[method].apply(route,slice.call(arguments,1));
       return this;
   }
});



function gettype(obj) {
    var type = typeof obj;

    if (type !== 'object') {
        return type;
    };

    return toString.call(obj).replace(objectRegExp,'$1')
}



