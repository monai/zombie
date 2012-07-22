var util = require("util");

function extend(target) {
    for (var i, k = 0, len = arguments.length; ++k < len;)
        for (i in arguments[k]) target[i] = arguments[k][i];
    return target;
};

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
};

function createFromTemplate(template, object) {
    object = (object) ? object : {};
    var path = template.split(".");
    
    (function iterate(parent, path) {
        if (!parent[path[0]]) parent[path[0]] = {};
        if (path.length > 1) iterate(parent[path[0]], path.splice(1));
    })(object, path);
    
    return object;
};

function setByPath(path, object, values) {
    object = (object) ? object : {};
    path = path.split(".");
    
    (function iterate(parent, path) {
        if (!parent[path[0]]) parent[path[0]] = {};
        if (path.length > 1) iterate(parent[path[0]], path.splice(1))
        else extend(parent[path[0]], values);
    })(object, path);
    
    return object;
};

function pad(ref, str, length) {
    var o = [ref];
    for (var i = length, l = ref.toString().length; i > l; i--) o.unshift(str);
    return o.join("");
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
    createFromTemplate: createFromTemplate,
    setByPath: setByPath,
    pad: pad
});
