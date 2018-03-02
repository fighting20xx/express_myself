/**
 * Created by seven on 2018/3/2.
 * fighting20xx@126.com
 */

'use strict'

var methods = require('methods');




var  proto = module.exports = function (options) {


    function router(req ,res, next) {
        router.handle(req,res,next);
    }

    return router;
};


proto.handle = function handle(req,res,out) {

};


proto.use = function use(fn) {

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