import { Runtime } from "./Runtime.js";
import { Replacer } from "./Replacer.js";

var SIGNATURE = "/*=es6now=*/";

var WRAP_CALLEE = "(function(fn, deps, name) { " +

    // Node.js:
    "if (typeof exports !== 'undefined') " +
        "fn(require, exports, module); " +

    // Insane module transport:
    "else if (typeof define === 'function' && define.amd) " +
        "define(['require', 'exports', 'module'].concat(deps), fn); " +

    // DOM global module:
    "else if (typeof window !== 'undefined' && name) " +
        "fn(null, window[name] = {}, {}); " +

    // Hail Mary:
    "else " +
        "fn(null, {}, {}); " +

"})";

var WRAP_HEADER = "function(require, exports, module) { " +
    "'use strict'; " +
    "function __load(p, l) { " +
        "module.__es6 = !l; var e = require(p); module.__es6 = false; " +
        "if (e && l) e.exports = e; " +
        "return e; " +
    "} ";

var WRAP_FOOTER = "\n\n}";

function sanitize(text) {

    // From node/lib/module.js/Module.prototype._compile
    text = text.replace(/^\#\!.*/, '');

    // From node/lib/module.js/stripBOM
    if (text.charCodeAt(0) === 0xFEFF)
        text = text.slice(1);

    return text;
}

function wrapRuntimeModule(text) {

    return "(function() {\n\n" + text + "\n\n}).call(this);\n\n";
}

export function translate(input, options = {}) {

    var replacer = options.replacer || new Replacer,
        output;

    input = sanitize(input);

    if (options.runtime) {

        input = "\n" +
            wrapRuntimeModule(Runtime.API) +
            wrapRuntimeModule(Runtime.ES6) +
            wrapRuntimeModule(Runtime.MapSet) +
            wrapRuntimeModule(Runtime.Promise) +
            input;
    }

    // Node modules are wrapped inside of a function expression, which allows
    // return statements
    if (options.functionContext)
        input = "(function(){" + input + "})";

    output = replacer.replace(input, { module: options.module });

    // Remove function expression wrapper for node-modules
    if (options.functionContext)
        output = output.slice(12, -2);

    if (options.wrap) {

        // Doesn't make sense to create a module wrapper for a non-module
        if (!options.module)
            throw new Error("Cannot wrap a non-module");

        output = wrapModule(
            output,
            replacer.dependencies.map(d => d.url),
            options.global);
    }

    return output;
}

export function wrapModule(text, dep, global) {

    return SIGNATURE + WRAP_CALLEE + "(" +
        WRAP_HEADER + text + WRAP_FOOTER + ", " +
        JSON.stringify(dep) + ", " +
        JSON.stringify(global || "") +
    ");";
}

export function isWrapped(text) {

    return text.indexOf(SIGNATURE) === 0;
}
