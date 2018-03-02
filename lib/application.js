/**
 * Created by seven on 2018/3/2.
 * fighting20xx@126.com
 */

'use strict'


var app = exports = module.exports = {};


app.init = function init() {

};



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
};