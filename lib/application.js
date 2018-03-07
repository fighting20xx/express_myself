/**
 * Created by seven on 2018/3/2.
 * fighting20xx@126.com
 */

'use strict'

var flatten = require('array-flatten');
var query = require('./middleware/query');
var app = exports = module.exports = {};
var compileETag = require('./utils').compileETag;
var setPrototypeOf = require('setprototypeof')
var methods = require('methods');


var slice = Array.prototype.slice;


var app = exports = module.exports = {};


var trustProxyDefaultSymbol = '@@symbol:trust_proxy_default';












app.init = function init() {
    this.cache = {};
    this.engines = {};
    this.settings = {};

    this.defaultConfiguration();
};

app.defaultConfiguration = function defaultConfiguration() {

};

app.lazyrouter = function lazyrouter() {
    if (!this._router) {
        this._router = new Router({
            caseSensitive: this.enabled('case sensitive routing'),
            strict: this.enabled('strict routing')
        });

        this._router.use(query(this.get('query parser fn')));
        this._router.use(middleware.init(this));
    }
}

app.handle = function handle(req,res,callback) {
    var router = this._router;
    router.handle(req,res,done);
};

app.use = function use(fn) {
  var offset = 0;
  var path = '/';

  if (typeof fn !== 'function') {
      var arg = fn;
      while (Array.isArray(arg) && arg.length !==0) {
          arg = arg[0];
      }

      if (typeof arg !== 'function') {
          offset =1;
          path = fn;
      }
  }

  var fns = flatten(slice.call(arguments,offset));

  if (fns.length === 0) {
      throw new TypeError('app.use() 需要的是一个函数 当中间件');
  }

  this.lazyrouter();
  var router = this._router;

  fns.forEach(function (fn) {

      if (!fn || !fn.handle || !fn.set){
          return router.use(path, fn);
      }

      debug('.use app under %s', path);
      fn.mountpath = path;
      fn.parent = this;

      router.use(path, function mounted_app(req, res, next) {
          var  orig = req.app;
          fh.handle(req,res, function (err) {
              setPrototypeOf(req, orig.request);
              setPrototypeOf(res, orig.response);
              next();
          });
      });

      fn.emit('mount', this)
  }, this);

  return this;
};


app.route = function route(path) {
    this.lazyrouter();
    return this._router.route(path);
};


method.forEach(function (method) {
    app[method] = function (path) {
        if (method === 'get' && arguments.length === 1) {
            return this.set(path);
        }

        this.lazyrouter();

        var route = this._router.route(path);
        route[method].apply(route, slice.call(arguments, 1));                      //slice.call(arguments, 1)  这里的参数是1 ，不是数组，所以用call  。   这里slice.call(arguments, 1)是数组  所以 用apply。
        return this;
    }
})







app.set = function set(setting, val) {
    if (arguments.length === 1) {
        return this.settings[setting];
    };

    debug('set "%s" to %o ', setting, val);

    this.settings[setting] = val;

    switch (setting) {
        case 'etag':
            this.set('etag fn', compileETag(val));
            break;
        case 'query parser':
            this.set('query parser fn',compileQueryParser(val) );
            break;
        case 'truse proxy':
            this.set('trust proxy fn ', compileTrust(val));

            Object.defineProperties(this.settings, trustProxyDefaultSymbol, {
                configurable: true,
                value: false
            });
            break;
    };

    return this;
}