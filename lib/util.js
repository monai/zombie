"use strict";

var util = require("util");

function extend(target) {
    for (var i, k = 0, len = arguments.length; ++k < len;) {
        for (i in arguments[k]) {
            target[i] = arguments[k][i];
        }
    }
    return target;
}

function inherits(constructor, superConstructor) {
    constructor.superConstructor = superConstructor;
    constructor.prototype = Object.create(superConstructor.prototype, {
        constructor: {
            value: constructor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
}

function nop() {
    
}

function dashToCamel(str) {
    return str.replace(/-(.)/g, function(match) { return match[1].toUpperCase(); });
}

extend(exports, {
    format: util.format,
    debug: util.debug,
    error: util.error,
    puts: util.puts,
    print: util.print,
    log: util.log,
    inspect: util.inspect,
    isArray: util.isArray,
    isRegEx: util.isRegEx,
    isDate: util.isDate,
    isError: util.isError,
    pump: util.pump,
    
    extend: extend,
    inherits: inherits,
    nop: nop,
    dashToCamel: dashToCamel
});
