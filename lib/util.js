var util = require("util");

function extend(target) {
    for (var i, k = 0, len = arguments.length; ++k < len;)
        for (i in arguments[k]) target[i] = arguments[k][i];
    return target;
};

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
});
