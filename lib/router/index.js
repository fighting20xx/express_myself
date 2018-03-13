/**
 * Created by seven on 2018/3/2.
 * fighting20xx@126.com
 */

'use strict'

var methods = require('methods');
var debug = require('debug')('express:router');
var parseUrl = require('parseurl');

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
    var self = this;

    debug('dispatching %s %s', req.method, req.url);

    var idx = 0;
    var protohost = getProtohost(req.url) || '';
    var removed ='';
    var slashAdded = false;
    var paramcalled = {};

    var options = [];

    var stack = self.stack;
    var parentParams = req.params;
    var parentUrl = req.baseUrl || '';
    var done = restore(out, req, 'baseUrl', 'next', 'params');

    req.next = next;

    if (req.method === 'OPTIONS') {
        done = wrap(done,function (old, err) {
            if (err || options.length === 0) {
                return old(err);
            };
            sendOptionsResponse(res, options, old);
        });
    }

    req.baseUrl = parentUrl;
    req.originalUrl = req.originalUrl || req.url;

    next();

    function next(err) {
        var layerErr = err === 'route'
            ? null
            : err;

        if (slashAdded) {
            req.url = req.url.substr(1);
            slashAdded = false;
        }
        if (removed.length !== 0) {
            req.baseUrl = parentUrl;
            req.url = protohost + removed + req.url.substr(protohost.length);
            removed = '';
        }

        if (layerErr === 'router') {
            setImmdiate(done, null);
            return;
        }

        if (idx >= stack.length) {
            setImmdiate(done, layerErr);
            return;
        }

        var path = getPathname(req);

        if (path == null) {
            return done(layerErr);
        }


        var layer;
        var match;
        var route;

        while (match !== true && idx <stack.length) {
            layer = stack[idx++];
            match = matchLayer(layer,path);
            route = layer.route;

            if (typeof match !== 'boolean') {
                layerErr = layerErr || match;
            }

            if (match !== true) {
                continue;
            }

            if (!route) {
                continue
            }

            if (layerErr) {
                match = false;
                continue;
            }

            var method = req.method;
            var has_method = route._handle_method(method);

            if (!has_method && method === 'OPTIONS'){
                appendMethods(options, route._options());
            }

            if (!has_method && method != 'HEAD'){
                match =false;
                continue;
            }
        }


        if (match !== true) {
            return done(layerErr);
        }

        if (route) {
            req.route = route;
        }


        req.params = self.mergeParams
            ? mergeParams(layer.params, parentParams)
            : layer.params;
        var layerPath = layer.path;

        self.process_params(layer, paramcalled, req, res, function (err) {
            if (err) {
                return next(layerErr || err);
            }

            if (route) {
                return layer.handle_request(req, res, next);
            }

            trim_prefix(layer, layerError, layerPath, path);
        });


    }
    function trim_prefix(layer, layerError, layerPath, path) {
        if (layerPath.length !== 0) {
            var c = path[layerPath.length]
            if (c && c !=='/' && c !=='.') {
                return next(layerError);
            }

            debug('trim prefix (%s) from url %s', layerPath, req.url);
            removed = layerPath;
            req.url = protohost + req.url.substr(protohost.length + removed.length);

            if (!protohost && req.url[0] !== '/') {
                req.url = '/' + req.url;
                slashAdded = true;
            }

            req.baseUrl = parentUrl + (removed[removed.length -1] === '/'
                ? removed.substring(0, removed.length -1 )
                : removed);
        }

        debug('%s %s : %s', layer.name, layerPath, req.originalUrl);

        if (layerError) {
            layer.handle_error(layerError, req, res, next);
        } else {
            layer.handle_request(req, res, next);
        }
    }
};


proto.process_params = function process_params(layer, called, req, res, done) {
    var params = this.params;
    var keys = layer.keys;

    if (!keys || keys.length === 0) {
        return done();
    }

    var i = 0;
    var name;
    var paramIndex = 0;
    var key;
    var paramVal;
    var paramCallbacks;
    var paramCalled;


    function param(err) {
        if (err) {
            return done(err);
        }

        if (i >= keys.length) {
            return done();
        }

        paramIndex = 0;
        key = keys[0];
        name = key.name;
        paramVal = req.params[name];
        paramCallbacks = params[name];
        paramCalled = called[name];

        if (paramVal === undefined || !paramC) {
            return param();
        }

        if (paramCalled &&
            (paramCalled.match === paramVal || (paramCalled.error && paramCalled.error !== 'route'))) {
            req.params[name] = paramCalled.value;

            return param(paramCalled.error);
        }

        called[name] = paramCalled = {
            error:null,
            match:paramVal,
            value:paramVal
        };

        paramCallbacks();

    };

    function paramCallback(err) {
        var fn = paramCallbacks[paramIndex++];
        paramCalled.value = req.params[key.name];

        if (err) {
            paramCalled.error = err;
            param(err);
            return;
        }

        if (!fn) {
            return param();
        }

        try {
            fn(req, res, paramCallbacks, paramVal, key.name);
        }catch (e) {
            paramCallback(e);
        }
    }

    param();

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
    var route = new Route(path);

    var layer = new Layer(path, {
        sensitive: this.caseSensitive,
        strict: this.strict,
        end: true
    }, route,dispatch.bind(route));

    layer.route = route;

    this.stack.push(layer);
    return route;
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


function restore(fn, obj) {
    var props = new Array(arguments.length - 2);
    var vals = new Array(arguments.length - 2 );

    for (var i = 0; i<props.length; i++){
        props[i] = arguments[i+2];
        vals[i] = obj[props[i]]
    }

    return function () {
        for (var i = 0; i<props.length; i++) {
            obj[props[i]] = vals[i];
        }

        return fn.apply(this, arguments);
    }
}

function wrap(old, fn) {
    return function proxy() {
        var args = new Array(arguments.length + 1);

        args[0] = old;
        for (var i = 0, len = arguments.length; i<len; i++) {
            args[i + i] = arguments[i];
        }

        fn.apply(this, args);
    }
}
function sendOptionsResponse(res, options, next) {
    try {
        var body = options.join(',');
        res.set('Allow', body);
        res.send(body);
    } catch (err) {
        next(err);
    }
}
function getPathname(req) {
    try {
        return parseUrl(req).pathname;
    } catch (err) {
        return undefined;
    }
}
function matchLayer(layer, path) {
    try {
        return layer.match(path);
    } catch (err){
        return err;
    }
}
// append methods to a list of methods
function appendMethods(list, addition) {
    for (var i = 0; i < addition.length; i++) {
        var method = addition[i];
        if (list.indexOf(method) === -1) {
            list.push(method);
        }
    }
}