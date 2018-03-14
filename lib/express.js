/**
 * Created by seven on 2018/3/2.
 * fighting20xx@126.com
 */

'use strict'

var merge  = require('merge-descriptors');
var bodyParser = require('body-parser');
var proto = require('./application.js');
var req = require('./request');
var res = require('./response');
var Router = require('./router/index');
var Route = require('./router/route');



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



exports.application = proto;
exports.request = req;
exports.response = res;


exports.Route = Route;
exports.Router = Router;




exports.json = bodyParser.json;
exports.query = require('./middleware/query');
exports.static = require('serve-static');
exports.urlencoded = bodyParser.urlencoded;


