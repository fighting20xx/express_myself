/**
 * Created by seven on 2018/3/2.
 * fighting20xx@126.com
 */

'use strict'

var flatten = require('array-flatten');
var query = require('./middleware/query');
var app = exports = module.exports = {};


app.init = function init() {

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








};