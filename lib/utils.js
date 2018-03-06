/**
 * Created by seven on 2018/3/5.
 * fighting20xx@126.com
 */

'use strict'

var etag = require('etag');
var querystring = require('querystring');






function createETagGenerator(options) {
    return function generateETag(body,encoding) {
        var buf = !Buffer.isBuffer(body)
            ? Buffer.from(body, encoding)
            : body
        return etag(buf, options);
    }
}
exports.etag = createETagGenerator({ weak: false })
exports.wetag = createETagGenerator({ weak: true })
exports.compileETag = function (val) {
    var fn;

    if (typeof val === 'function') {
        return val;
    };

    switch (val) {
        case true:
            fn = exports.wetag;
            break;
        case false:
            break;
        case 'strong':
            fn = exports.etag;
            break;
        case 'weak':
            fn = exports.wetag;
            break;
        default:
            throw new TypeError('unknow value for etag function: ' +val);
    };

    return fn;
}


exports.getType = function getType(val) {
    var  regExp = /^\[object ([a-zA-Z]*)\]$/;
    var  gettype=Object.prototype.toString;
    return gettype.call(val).replace(regExp, '$1').toLowerCase();
};






exports.compileQueryParser = function compileQueryParser(val) {

    var fn;

    if (typeof val === 'function'){
        return val;
    }

    switch (val) {
        case true:
            fn = querystring.parse;
            break;
        case false:
            fn = newObject;
            break;
        case 'extended':
            fn = parseExtendedQueryString;
            break;
        case 'simple':
            fn = query.parse;
            break;
        default:
            throw new TypeError('unknow value for query parser function: ' + val);
    }

    return fn;
};




exports.compileTrust = function (val) {
    if (typeof val === 'function') {
        return val;
    }

    if (val === true) {
        return function () {   return true;     };
    }

    if (typeof val === 'number') {
        return function (a, i) {  return i < val };
    }

    if (typeof val === 'string') {
        val = val.split(/ *, */);
    }

    return proxyaddr.compile(val || []);
}

















function parseExtendedQueryString(str) {
    return qs.parse(str, {
        allowPrototypes:true
    });
}

function newObject() {
    return {};
}


