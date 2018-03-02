/**
 * Created by seven on 2018/3/2.
 * fighting20xx@126.com
 */

'use strict'

var merge  = require('merge-descriptors');

var proto = require('./application');
var req = require('./request');
var res = require('./response');
var router = require('./router/index');



exports = module.exports = createApplication;



function createApplication() {
    var app = function (req,res,next) {
        app.handle(req,res,next);
    };
    merge(app,proto,false);


    app.request = req;
    app.response = res;

    app.init();

    return app;
}








