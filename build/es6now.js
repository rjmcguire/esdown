/*=es6now=*/(function(fn, deps) { if (typeof exports !== 'undefined') fn.call(typeof global === 'object' ? global : this, require, exports); else if (typeof __MODULE === 'function') __MODULE(fn, deps); else if (typeof define === 'function' && define.amd) define(['require', 'exports'].concat(deps), fn); else if (typeof window !== 'undefined' && "") fn.call(window, null, window[""] = {}); else fn.call(window || this, null, {}); })(function(require, exports) { "use strict"; 

var __modules = [], __exports = [], __global = this; 

function __require(i, obj) { 
    var e = __exports; 
    if (e[i] !== void 0) return e[i]; 
    __modules[i].call(__global, e[i] = (obj || {})); 
    return e[i]; 
} 

__modules[0] = function(exports) {
var initialize = __require(1).initialize;

// Initialize the runtime support library
initialize();

var Program = __require(2);

if (typeof require === "function" && 
    typeof module !== "undefined" && 
    module === require.main) {
    
    Program.run();
}
};

__modules[1] = function(exports) {
var _M0 = __require(3); Object.keys(_M0).forEach(function(k) { exports[k] = _M0[k]; });
};

__modules[2] = function(exports) {
var FS = require("fs");
var Path = require("path");
var CommandLine = __require(4);
var FFS = __require(5);

var Promise = __require(6).Promise;
var bundle = __require(7).bundle;
var Server = __require(8).Server;
var translate = __require(9).translate;

function absPath(path) {

    return Path.resolve(process.cwd(), path);
}

function writeFile(path, text) {

    console.log("[Writing] " + absPath(path));
    FS.writeFileSync(path, text, "utf8");
}

function overrideCompilation() {

    // Compile ES6 js files
    require.extensions[".js"] = (function(module, filename) {
    
        var text;
        
        try {
        
            text = translate(FS.readFileSync(filename, "utf8"));
        
        } catch (e) {
        
            if (e instanceof SyntaxError)
                e = new SyntaxError("" + (e.message) + " (" + (filename) + ":" + (e.position.line) + ":" + (e.position.column) + ")");
            
            throw e;
        }
        
        return module._compile(text, filename);
    });
}

function run() {

    CommandLine.run({
    
        "*": {
        
            params: {
            
                "target": {
                
                    positional: true,
                    required: true
                }
            },
            
            execute: function(params) {
            
                params.debug = true;
                overrideCompilation();
                require(absPath(params.target));
            }
        
        },
        
        translate: {
        
            params: {
        
                "input": {
        
                    short: "i",
                    positional: true,
                    required: true
                },
                
                "output": {
                    
                    short: "o",
                    positional: true,
                    required: false
                },
                
                "global": { short: "g" },
                
                "debug": { flag: true }
            },
            
            execute: function(params) {
            
                var options = { 
                
                    global: params.global,
                    
                    log: function(filename) { 
                    
                        console.log("[Reading] " + absPath(filename));
                    }
                };
                
                options.log(params.input);
                
                FFS
                .readFile(params.input, "utf8")
                .then((function(text) { return translate(text, options); }))
                .then((function(text) {
                
                    if (params.output) writeFile(params.output, text);
                    else console.log(text);
                    
                }), (function(err) {
                
                    throw err;
                }));           
            }
        },
        
        bundle: {
        
            params: {
        
                "input": {
        
                    short: "i",
                    positional: true,
                    required: true
                },
                
                "output": {
                    
                    short: "o",
                    positional: true,
                    required: false
                },
                
                "global": { short: "g" },
                
                "debug": { flag: true }
            },
            
            execute: function(params) {
            
                var options = { 
                
                    global: params.global,
                    
                    log: function(filename) { 
                    
                        console.log("[Reading] " + absPath(filename));
                    }
                };
                
                bundle(params.input, options).then((function(text) {
                
                    if (params.output) writeFile(params.output, text);
                    else console.log(text);
                    
                }), (function(err) {
                
                    throw err;
                }));           
            }
        },
        
        serve: {
        
            params: {
            
                "root": { short: "r", positional: true },
                "port": { short: "p", positional: true }
            },
            
            execute: function(params) {
            
                var server = new Server(params);
                server.start();
                
                console.log("Listening on port " + server.port + ".  Press Enter to exit.");
                
                var stdin = process.stdin;
                
                stdin.resume();
                stdin.setEncoding('utf8');
                
                stdin.on("data", (function() { 
                
                    server.stop().then((function(val) { process.exit(0); }));
                }));
            }
        },
        
        error: function(err, params) {
        
            if (params.debug) {
            
                throw err;
            
            } else {
            
                console.log("Oops! ", err.toString());
            }
            
            process.exit(1);
        }
    });
}
exports.run = run;
};

__modules[3] = function(exports) {
var Class = __require(10).Class;
var emulate = __require(11).emulate;

var initialized = false,
    global = this;

function initialize() {

    if (initialized)
        return;
    
    emulate();
    
    global.es6now = {
    
        Class: Class
    };
    
    initialized = true;
}

exports.initialize = initialize;
};

__modules[4] = function(exports) {
function parse(argv, params) {

    var pos = Object.keys(params),
        values = {},
        shorts = {},
        required = [],
        param,
        value,
        name,
        i,
        a;
    
    // Create short-to-long mapping
    pos.forEach((function(name) {
    
        var p = params[name];
        
        if (p.short)
            shorts[p.short] = name;
        
        if (p.required)
            required.push(name);
    }));
    
    // For each command line arg...
    for (i = 0; i < argv.length; ++i) {
    
        a = argv[i];
        param = null;
        value = null;
        name = "";
        
        if (a[0] === "-") {
        
            if (a.slice(0, 2) === "--") {
            
                // Long named parameter
                param = params[name = a.slice(2)];
            
            } else {
            
                // Short named parameter
                param = params[name = shorts[a.slice(1)]];
            }
            
            // Verify parameter exists
            if (!param)
                throw new Error("Invalid command line option: " + a);
            
            if (param.flag) {
            
                value = true;
            
            } else {
            
                // Get parameter value
                value = argv[++i] || "";
                
                if (typeof value !== "string" || value[0] === "-")
                    throw new Error("No value provided for option " + a);
            }
            
        } else {
        
            // Positional parameter
            do { param = params[name = pos.shift()]; } 
            while (param && !param.positional);;
            
            value = a;
        }
        
        if (param)
            values[name] = value;
    }
    
    required.forEach((function(name) {
    
        if (values[name] === undefined)
            throw new Error("Missing required option: --" + name);
    }));
    
    return values;
}

function fail(msg) {

    console.log(msg);
    process.exit(1);
}

function runCommand(command, options) {
    
    options || (options = {});
    
    var argv = options.args || process.argv.slice(2),
        error = options.error || command.error || fail,
        params = {};
    
    try {
    
        params = parse(argv, command.params || {});
        return command.execute(params);
    
    } catch (err) {
    
        return error(err, params);
    }
}

function run(config) {

    var error = config.error || fail,
        argv = process.argv.slice(2),
        action = argv[0] || "*",
        command;
    
    if (!action)
        return error("No action specified.", {});
    
    command = config[action];
    
    if (!command) {
    
        if (config["*"]) {
        
            argv.unshift(command);
            command = config["*"];

        } else {
        
            return error("Invalid command: " + action, {});
        }
    }
    
    return runCommand(command, {
    
        args: argv.slice(1),
        error: config.error 
    });
}

/*

Example: 

parse(process.argv.slice(2), {

    "verbose": {
    
        short: "v",
        flag: true
    },
    
    "input": {
    
        short: "i",
        positional: true,
        required: true
    },
    
    "output": {
    
        short: "o",
        positional: true
    },
    
    "recursive": {
    
        short: "r",
        flag: false
    }
});

*/

exports.parse = parse;
exports.runCommand = runCommand;
exports.run = run;
};

__modules[5] = function(exports) {
var FS = require("fs");

var Promise = __require(6).Promise;

// Wraps a standard Node async function with a promise
// generating function
function wrap(obj, name) {

	return function() {
	
		var a = [].slice.call(arguments, 0),
			promise = new Promise;
		
		a.push((function(err, data) {
		
			if (err) promise.reject(err);
			else promise.resolve(data);
		}));
		
		if (name) obj[name].apply(obj, a);
    	else obj.apply(null, a);
		
		return promise.future;
	};
}

var 
    exists = wrap(FS.exists),
    readFile = wrap(FS.readFile),
    close = wrap(FS.close),
    open = wrap(FS.open),
    read = wrap(FS.read),
    write = wrap(FS.write),
    rename = wrap(FS.rename),
    truncate = wrap(FS.truncate),
    rmdir = wrap(FS.rmdir),
    fsync = wrap(FS.fsync),
    mkdir = wrap(FS.mkdir),
    sendfile = wrap(FS.sendfile),
    readdir = wrap(FS.readdir),
    fstat = wrap(FS.fstat),
    lstat = wrap(FS.lstat),
    stat = wrap(FS.stat),
    readlink = wrap(FS.readlink),
    symlink = wrap(FS.symlink),
    link = wrap(FS.link),
    unlink = wrap(FS.unlink),
    fchmod = wrap(FS.fchmod),
    lchmod = wrap(FS.lchmod),
    chmod = wrap(FS.chmod),
    lchown = wrap(FS.lchown),
    fchown = wrap(FS.fchown),
    chown = wrap(FS.chown),
    utimes = wrap(FS.utimes),
    futimes = wrap(FS.futimes),
    writeFile = wrap(FS.writeFile),
    appendFile = wrap(FS.appendFile),
    realpath = wrap(FS.realpath);

exports.exists = exists;
exports.readFile = readFile;
exports.close = close;
exports.open = open;
exports.read = read;
exports.write = write;
exports.rename = rename;
exports.truncate = truncate;
exports.rmdir = rmdir;
exports.fsync = fsync;
exports.mkdir = mkdir;
exports.sendfile = sendfile;
exports.readdir = readdir;
exports.fstat = fstat;
exports.lstat = lstat;
exports.stat = stat;
exports.readlink = readlink;
exports.symlink = symlink;
exports.link = link;
exports.unlink = unlink;
exports.fchmod = fchmod;
exports.lchmod = lchmod;
exports.chmod = chmod;
exports.lchown = lchown;
exports.fchown = fchown;
exports.chown = chown;
exports.utimes = utimes;
exports.futimes = futimes;
exports.writeFile = writeFile;
exports.appendFile = appendFile;
exports.realpath = realpath;
};

__modules[6] = function(exports) {
var _M0 = __require(12); Object.keys(_M0).forEach(function(k) { exports[k] = _M0[k]; });
};

__modules[7] = function(exports) {
var Path = require("path");
var FFS = __require(5);

var Promise = __require(6).Promise;
var _M0 = __require(9), translate = _M0.translate, wrap = _M0.wrap;

var EXTERNAL = /^[a-z]+:|^[^\.]+$/i;

var OUTPUT_BEGIN = "var __modules = [], __exports = [], __global = this; \n\
\n\
function __require(i, obj) { \n\
    var e = __exports; \n\
    if (e[i] !== void 0) return e[i]; \n\
    __modules[i].call(__global, e[i] = (obj || {})); \n\
    return e[i]; \n\
} \n";

function hasKey(obj, key) {

    return Object.prototype.hasOwnProperty.call(obj, key);
}

function isExternal(path) {

    return EXTERNAL.test(path);
}

function resolve(path, base) {

    if (!isExternal(path) && base)
        path = Path.resolve(base, path);
    
    return path;
}

function bundle(filename, options) {

    options || (options = {});
    
    var externals = {},
        modules = {},
        nodes = [],
        current = 0;
    
    createNode(filename, null);
    
    return next();
    
    function createNode(path, base) {
    
        path = resolve(path, base);
        
        if (hasKey(modules, path))
            return modules[path];
        
        var index = nodes.length;
        
        modules[path] = index;
        nodes.push({ path: path, factory: "" });
        
        return index;
    }
    
    function next() {
    
        if (current >= nodes.length)
            return Promise.when(end());
        
        var node = nodes[current],
            path = node.path,
            dir = Path.dirname(path);
        
        current += 1;
        
        if (options.log)
            options.log(path);
        
        // Read file
        return FFS.readFile(path, "utf8").then((function(text) {
        
            node.factory = translate(text, {
            
                wrap: false,
                
                requireCall: function(url) {
                
                    if (isExternal(url)) {
                
                        externals[url] = 1;
                        return "require(" + JSON.stringify(url) + ")";
                    }
                    
                    return "__require(" + createNode(url, dir).toString() + ")";
                },
                
                mapURL: function() {
                
                }
            });
            
            return next();
        }));
    }
    
    function end() {
    
        var out = OUTPUT_BEGIN, i;

        for (i = 0; i < nodes.length; ++i) {
        
            out += "\n__modules[" + i.toString() + "] = ";
            out += "function(exports) {\n" + nodes[i].factory + "\n};\n";
        }
        
        out += "\n__require(0, exports);\n";
        out = wrap("\n\n" + out, Object.keys(externals), options.global);
        
        return out;
    }
}

exports.bundle = bundle;
};

__modules[8] = function(exports) {
var __this = this; var FS = require("fs");
var HTTP = require("http");
var Path = require("path");
var URL = require("url");
var FFS = __require(5);

var Promise = __require(6).Promise;
var _M0 = __require(9), translate = _M0.translate, isWrapped = _M0.isWrapped;
var mimeTypes = __require(13).mimeTypes;

var DEFAULT_PORT = 80,
    DEFAULT_ROOT = ".",
    JS_FILE = /\.js$/i;

var Server = es6now.Class(null, function(__super) { return {

    constructor: function(options) { var __this = this; 
    
        options || (options = {});
    
        this.root = Path.resolve(options.root || DEFAULT_ROOT);
        this.port = options.port || DEFAULT_PORT;
        this.hostname = options.hostname || null;
        this.server = HTTP.createServer((function(request, response) { return __this.onRequest(request, response); }));
        this.active = false;
    },
    
    start: function(port, hostname) {
    
        if (this.active)
            throw new Error("Server is already listening");
        
        if (port)
            this.port = port;
        
        if (hostname)
            this.hostname = hostname;
        
        var promise = new Promise;
        this.server.listen(this.port, this.hostname, promise.callback);
        
        this.active = true;
        
        return promise.future;
    },
    
    stop: function() {
    
        var promise = new Promise;
        
        if (this.active) {
        
            this.active = false;
            this.server.close((function(ok) { return promise.resolve(null); }));
        
        } else {
        
            promise.resolve(null);
        }
        
        return promise.future;
    },
    
    onRequest: function(request, response) { var __this = this; 
    
        if (request.method !== "GET" && request.method !== "HEAD")
            return this.error(405, response);
        
        var path = URL.parse(request.url).pathname;
        
        path = Path.join(this.root, path);
        
        if (path.indexOf(this.root) !== 0)
            return this.error(403, response);
        
        FFS.stat(path).then((function(stat) {
        
            if (stat.isDirectory())
                return __this.streamDefault(path, response);
            
            if (stat.isFile()) {
            
                return JS_FILE.test(path) ? 
                    __this.streamJS(path, response) : 
                    __this.streamFile(path, stat.size, response);
            }
            
            return __this.error(404, response);
            
        }), (function(err) {
        
            return __this.error(404, response);
            
        }));
    },
    
    error: function(code, response) {
    
        response.writeHead(code, { "Content-Type": "text/plain" });
        response.write(HTTP.STATUS_CODES[code] + "\n")
        response.end();
    },
    
    streamDefault: function(path, response) { var __this = this; 
    
        var files = [ "index.html", "index.htm", "default.html", "default.htm" ];
        
        var next = (function() {
        
            if (files.length === 0)
                return __this.error(404, response);
            
            var file = files.shift(),
                search = Path.join(path, file);
            
            FFS.stat(search).then((function(stat) {
            
                if (!stat.isFile())
                    return next();
                
                path = search;
                __this.streamFile(path, stat.size, response);
                
            }), (function(err) {
            
                return next();
            }));
        });
        
        next();
    },
    
    streamJS: function(path, response) { var __this = this; 
        
        FFS.readFile(path, "utf8").then((function(source) {
        
            if (!isWrapped(source)) {
            
                // TODO:  A better way to report errors?
                try { source = translate(source); } 
                catch (x) { source += "\n\n// " + x.message; }
            }
            
            response.writeHead(200, { "Content-Type": "text/javascript; charset=UTF-8" });
            response.end(source, "utf8");
        
        }), (function(err) {
        
            __this.error(500, err);
        }));
    },
    
    streamFile: function(path, size, response) { var __this = this; 
            
        var ext = Path.extname(path).slice(1).toLowerCase();
            
        var headers = { 
    
            // TODO: we should only append charset to certain types
            "Content-Type": (mimeTypes[ext] || mimeTypes["*"]) + "; charset=UTF-8",
            "Content-Length": size
        };
            
        var stream = FS.createReadStream(path, { 
        
            flags: "r", 
            mode: 438
        });
        
        stream.on("error", (function(err) {
        
            __this.error(500, response);
        }));
        
        stream.on("data", (function(data) {
        
            if (headers) {
            
                response.writeHead(200, headers);
                headers = null;
            }
        }));
        
        stream.pipe(response);
    }
}});
exports.Server = Server;
};

__modules[9] = function(exports) {
var Replacer = __require(14).Replacer;

var SIGNATURE = "/*=es6now=*/";

var WRAP_CALLEE = "(function(fn, deps) { " +

    // Node.js, Rewrapped:
    "if (typeof exports !== 'undefined') " +
        "fn.call(typeof global === 'object' ? global : this, require, exports); " +
        
    // Sane module transport:
    "else if (typeof __MODULE === 'function') " +
        "__MODULE(fn, deps); " +
        
    // Insane module transport:
    "else if (typeof define === 'function' && define.amd) " +
        "define(['require', 'exports'].concat(deps), fn); " +
        
    // DOM global module:
    "else if (typeof window !== 'undefined' && {0}) " +
        "fn.call(window, null, window[{0}] = {}); " +
    
    // Hail Mary:
    "else " +
        "fn.call(window || this, null, {}); " +

"})";

function sanitize(text) {

    // From node/lib/module.js/Module.prototype._compile
    text = text.replace(/^\#\!.*/, '');
    
    // From node/lib/module.js/stripBOM
    if (text.charCodeAt(0) === 0xFEFF)
        text = text.slice(1);
    
    return text;
}

function translate(input, options) {

    options || (options = {});
    
    var replacer = new Replacer(),
        output;
    
    if (options.requireCall)
        replacer.requireCall = options.requireCall;
    
    input = sanitize(input);
    output = replacer.replace(input);
    
    Object.keys(replacer.exports).forEach((function(k) {
    
        output += "\nexports." + k + " = " + replacer.exports[k] + ";";
    }));
    
    if (options.wrap !== false)
        output = wrap(output, replacer.dependencies, options.global);
    
    return output;
}

function wrap(text, dep, global) {

    var callee = WRAP_CALLEE.replace(/\{0\}/g, JSON.stringify(global || ""));
    
    return SIGNATURE + callee + "(function(require, exports) { \"use strict\"; " + text + "\n\n}, " + JSON.stringify(dep) + ");";
}

function isWrapped(text) {

    return text.indexOf(SIGNATURE) === 0;
}


exports.translate = translate;
exports.wrap = wrap;
exports.isWrapped = isWrapped;
};

__modules[10] = function(exports) {
var HOP = {}.hasOwnProperty,
    STATIC = /^__static_/;

function copyMethods(to, from, classMethods) {

    var keys = Object.keys(from),
        isStatic,
        desc,
        k,
        i;
    
    for (i = 0; i < keys.length; ++i) {
    
        k = keys[i];
        desc = Object.getOwnPropertyDescriptor(from, k);
        
        if (STATIC.test(k) === classMethods)
            Object.defineProperty(to, classMethods ? k.replace(STATIC, "") : k, desc);
    }
    
    return to;
}

function Class(base, def) {

    function constructor() { 
    
        if (parent && parent.constructor)
            parent.constructor.apply(this, arguments);
    }
    
	var parent = null,
	    proto,
	    props;
	
	if (base) {
	
        if (typeof base === "function") {
        
            parent = base.prototype;
            
        } else {
        
            parent = base;
            base = null;
        }
	}
	
	// Generate the method collection, closing over "super"
	props = def(parent);
	
	// Create prototype object
	proto = copyMethods(Object.create(parent), props, false);
	
	// Get constructor method
	if (HOP.call(props, "constructor")) constructor = props.constructor;
	else proto.constructor = constructor;
	
	// Set constructor's prototype
	constructor.prototype = proto;
	
	// "Inherit" class methods
	if (base) copyMethods(constructor, base, false);
	
	// Set class "static" methods
	copyMethods(constructor, props, true);
	
	return constructor;
}


exports.Class = Class;
};

__modules[11] = function(exports) {
var ES5 = __require(15);

var global = this;

function addProps(obj, props) {

    Object.keys(props).forEach((function(k) {
    
        if (typeof obj[k] !== "undefined")
            return;
        
        Object.defineProperty(obj, k, {
        
            value: props[k],
            configurable: true,
            enumerable: false,
            writable: true
        });
    }));
}

function emulate() {

    ES5.emulate();
    
    addProps(Number, {
    
        EPSILON: Number.EPSILON || (function() {
        
            var next, result;
            
            for (next = 1; 1 + next !== 1; next = next / 2)
                result = next;
            
            return result;
        }()),
        
        MAX_INTEGER: 9007199254740992,
        
        isFinite: function(val) {
            
            return typeof val === "number" && isFinite(val);
        },
        
        isNaN: function(val) {
        
            return typeof val === "number" && isNaN(val);
        },
        
        isInteger: function(val) {
        
            typeof val === "number" && val | 0 === val;
        },
        
        toInteger: function(val) {
            
            return val | 0;
        }
    });
    
    addProps(Array, {
    
        from: function(arg) {
            // TODO
        },
        
        of: function() {
            // ?
        }
    
    });
    
    addProps(String.prototype, {
        
        repeat: function(count) {
        
            return new Array(count + 1).join(this);
        },
        
        startsWith: function(search, start) {
        
            return this.indexOf(search, start) === start;
        },
        
        endsWith: function(search, end) {
        
            return this.slice(-search.length) === search;
        },
        
        contains: function(search, pos) {
        
            return this.indexOf(search, pos) !== -1;
        }
    });
    
    if (typeof Map === "undefined") global.Map = (function() {
    
        function Map() {
        
        }
        
        return Map;
        
    })();
    
    if (typeof Set === "undefined") global.Set = (function() {
    
        function Set() {
        
        }
        
        return Set;
        
    })();
    
}



exports.emulate = emulate;
};

__modules[12] = function(exports) {
var identity = (function(obj) { return obj; }),
    freeze = Object.freeze || identity,
    queue = [],
    waiting = false,
    asap;

// UUID property names used for duck-typing
var DISPATCH = "07b06b7e-3880-42b1-ad55-e68a77514eb9",
    IS_FAILURE = "7d24bf0f-d8b1-4783-b594-cec32313f6bc";

var EMPTY_LIST_MSG = "List cannot be empty.",
    WAS_RESOLVED_MSG = "The promise has already been resolved.",
    CYCLE_MSG = "A promise cycle was detected.";

var THROW_DELAY = 50;

// Enqueues a message
function enqueue(future, args) {

    queue.push({ fn: future[DISPATCH], args: args });
    
    if (!waiting) {
    
        waiting = true;
        asap(flush);
    }
}

// Flushes the message queue
function flush() {

    waiting = false;

    while (queue.length > 0) {
        
        // Send each message in queue
        for (var count = queue.length, msg; count > 0; --count) {
        
            msg = queue.shift();
            msg.fn.apply(void 0, msg.args);
        }
    }
}

// Returns a cycle error
function cycleError() {

    return failure(CYCLE_MSG);
}

// Future constructor
function Future(dispatch) {
    
    this[DISPATCH] = dispatch;
}

// Registers a callback for completion when a future is complete
Future.prototype.then = function then(onSuccess, onFail) {

    onSuccess || (onSuccess = identity);
    
    var resolve = (function(value) { return finish(value, onSuccess); }),
        reject = (function(value) { return finish(value, onFail); }),
        promise = new Promise(onQueue),
        target = this,
        done = false;
    
    onQueue(onSuccess, onFail);
    
    return promise.future;
    
    function onQueue(success, error) {
    
        if (success && resolve) {
        
            enqueue(target, [ resolve, null ]);
            resolve = null;
        }
        
        if (error && reject) {
        
            enqueue(target, [ null, reject ]);
            reject = null;
        }
    }
    
    function finish(value, transform) {
    
        if (!done) {
        
            done = true;
            promise.resolve(applyTransform(transform, value));
        }
    }
};

// Begins a deferred operation
function Promise(onQueue) {

    var token = {},
        pending = [],
        throwable = true,
        next = null;

    this.future = freeze(new Future(dispatch));
    this.resolve = resolve;
    this.reject = reject;
    
    freeze(this);
    
    // Dispatch function for future
    function dispatch(success, error, src) {
    
        var msg = [success, error, src || token];
        
        if (error)
            throwable = false;
        
        if (pending) {
        
            pending.push(msg);
            
            if (onQueue)
                onQueue(success, error);
        
        } else {
        
            // If a cycle is detected, convert resolution to a rejection
            if (src === token) {
            
                next = cycleError();
                maybeThrow();
            }
            
            enqueue(next, msg);
        }
    }
    
    // Resolves the promise
    function resolve(value) {
    
        if (!pending)
            throw new Error(WAS_RESOLVED_MSG);
        
        var list = pending;
        pending = false;
        
        // Create a future from the provided value
        next = when(value);

        // Send internally queued messages to the next future
        for (var i = 0; i < list.length; ++i)
            enqueue(next, list[i]);
        
        maybeThrow();
    }
    
    // Resolves the promise with a rejection
    function reject(error) {
    
        resolve(failure(error));
    }
    
    // Throws an error if the promise is rejected and there
    // are no error handlers
    function maybeThrow() {
    
        if (!throwable || !isFailure(next))
            return;
        
        setTimeout((function() {
        
            var error = null;
            
            // Get the error value
            next[DISPATCH](null, (function(val) { return error = val; }));
            
            // Throw it
            if (error && throwable)
                throw error;
            
        }), THROW_DELAY);
    }
}

// Returns a future for an object
function when(obj) {

    if (obj && obj[DISPATCH])
        return obj;
    
    if (obj && obj.then) {
    
        var promise = new Promise();
        obj.then(promise.resolve, promise.reject);
        return promise.future;
    }
    
    // Wrap a value in an immediate future
    return freeze(new Future((function(success) { return success && success(obj); })));
}

// Returns true if the object is a failed future
function isFailure(obj) {

    return obj && obj[IS_FAILURE];
}

// Creates a failure Future
function failure(value) {

    var future = new Future((function(success, error) { return error && error(value); }));
    
    // Tag the future as a failure
    future[IS_FAILURE] = true;
    
    return freeze(future);
}

// Applies a promise transformation function
function applyTransform(transform, value) {

    try { return (transform || failure)(value); }
    catch (ex) { return failure(ex); }
}

// Returns a future for every completed future in an array
function whenAll(list) {

    var count = list.length,
        promise = new Promise(),
        out = [],
        value = out,
        i;
    
    for (i = 0; i < list.length; ++i)
        waitFor(list[i], i);
    
    if (count === 0)
        promise.resolve(out);
    
    return promise.future;
    
    function waitFor(f, index) {
    
        when(f).then((function(val) { 
        
            out[index] = val;
            
            if (--count === 0)
                promise.resolve(value);
        
        }), (function(err) {
        
            value = failure(err);
            
            if (--count === 0)
                promise.resolve(value);
        }));
    }
}

// Returns a future for the first completed future in an array
function whenAny(list) {

    if (list.length === 0)
        throw new Error(EMPTY_LIST_MSG);
    
    var promise = new Promise(), i;
    
    for (i = 0; i < list.length; ++i)
        when(list[i]).then((function(val) { return promise.resolve(val); }), (function(err) { return promise.reject(err); }));
    
    return promise.future;
}

function iterate(fn) {

    var done = false,
        stop = (function(val) { done = true; return val; }),
        next = (function(last) { return done ? last : when(fn(stop)).then(next); });
    
    return when(null).then(next);
}

function forEach(list, fn) {

    var i = -1;
    
    return iterate((function(stop) { return (++i >= list.length) ? stop() : fn(list[i], i, list); }));
}

// === Event Loop API ===

asap = (function(global) {
    
    var msg = uuid(),
        process = global.process,
        window = global.window,
        msgChannel = null,
        list = [];
    
    if (process && typeof process.nextTick === "function") {
    
        // NodeJS
        return process.nextTick;
   
    } else if (window && window.addEventListener && window.postMessage) {
    
        // Modern Browsers
        if (window.MessageChannel) {
        
            msgChannel = new window.MessageChannel();
            msgChannel.port1.onmessage = onmsg;
        
        } else {
        
            window.addEventListener("message", onmsg, true);
        }
        
        return (function(fn) {
        
            list.push(fn);
            
            if (msgChannel !== null)
                msgChannel.port2.postMessage(msg);
            else
                window.postMessage(msg, "*");
            
            return 1;
        });
    
    } else {
    
        // Legacy
        return (function(fn) { return setTimeout(fn, 0); });
    }
        
    function onmsg(evt) {
    
        if (msgChannel || (evt.source === window && evt.data === msg)) {
        
            evt.stopPropagation();
            if (list.length) list.shift()();
        }
    }
    
    function uuid() {
    
        return [32, 16, 16, 16, 48].map((function(bits) { return rand(bits); })).join("-");
        
        function rand(bits) {
        
            if (bits > 32) 
                return rand(bits - 32) + rand(32);
            
            var str = (Math.random() * 0xffffffff >>> (32 - bits)).toString(16),
                len = bits / 4 >>> 0;
            
            if (str.length < len) 
                str = (new Array(len - str.length + 1)).join("0") + str;
            
            return str;
        }
    }
    
})(this);

Promise.when = when;
Promise.whenAny = whenAny;
Promise.whenAll = whenAll;
Promise.forEach = forEach;
Promise.iterate = iterate;
Promise.reject = failure;


exports.Promise = Promise;
};

__modules[13] = function(exports) {
var mimeTypes = {

    "aiff": "audio/x-aiff",
    "arj": "application/x-arj-compressed",
    "asf": "video/x-ms-asf",
    "asx": "video/x-ms-asx",
    "au": "audio/ulaw",
    "avi": "video/x-msvideo",
    "bcpio": "application/x-bcpio",
    "ccad": "application/clariscad",
    "cod": "application/vnd.rim.cod",
    "com": "application/x-msdos-program",
    "cpio": "application/x-cpio",
    "cpt": "application/mac-compactpro",
    "csh": "application/x-csh",
    "css": "text/css",
    "deb": "application/x-debian-package",
    "dl": "video/dl",
    "doc": "application/msword",
    "drw": "application/drafting",
    "dvi": "application/x-dvi",
    "dwg": "application/acad",
    "dxf": "application/dxf",
    "dxr": "application/x-director",
    "etx": "text/x-setext",
    "ez": "application/andrew-inset",
    "fli": "video/x-fli",
    "flv": "video/x-flv",
    "gif": "image/gif",
    "gl": "video/gl",
    "gtar": "application/x-gtar",
    "gz": "application/x-gzip",
    "hdf": "application/x-hdf",
    "hqx": "application/mac-binhex40",
    "htm": "text/html",
    "html": "text/html",
    "ice": "x-conference/x-cooltalk",
    "ico": "image/x-icon",
    "ief": "image/ief",
    "igs": "model/iges",
    "ips": "application/x-ipscript",
    "ipx": "application/x-ipix",
    "jad": "text/vnd.sun.j2me.app-descriptor",
    "jar": "application/java-archive",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "text/javascript",
    "json": "application/json",
    "latex": "application/x-latex",
    "less": "text/css",
    "lsp": "application/x-lisp",
    "lzh": "application/octet-stream",
    "m": "text/plain",
    "m3u": "audio/x-mpegurl",
    "man": "application/x-troff-man",
    "manifest": "text/cache-manifest",
    "me": "application/x-troff-me",
    "midi": "audio/midi",
    "mif": "application/x-mif",
    "mime": "www/mime",
    "movie": "video/x-sgi-movie",
    "mp4": "video/mp4",
    "mpg": "video/mpeg",
    "mpga": "audio/mpeg",
    "ms": "application/x-troff-ms",
    "nc": "application/x-netcdf",
    "oda": "application/oda",
    "ogm": "application/ogg",
    "pbm": "image/x-portable-bitmap",
    "pdf": "application/pdf",
    "pgm": "image/x-portable-graymap",
    "pgn": "application/x-chess-pgn",
    "pgp": "application/pgp",
    "pm": "application/x-perl",
    "png": "image/png",
    "pnm": "image/x-portable-anymap",
    "ppm": "image/x-portable-pixmap",
    "ppz": "application/vnd.ms-powerpoint",
    "pre": "application/x-freelance",
    "prt": "application/pro_eng",
    "ps": "application/postscript",
    "qt": "video/quicktime",
    "ra": "audio/x-realaudio",
    "rar": "application/x-rar-compressed",
    "ras": "image/x-cmu-raster",
    "rgb": "image/x-rgb",
    "rm": "audio/x-pn-realaudio",
    "rpm": "audio/x-pn-realaudio-plugin",
    "rtf": "text/rtf",
    "rtx": "text/richtext",
    "scm": "application/x-lotusscreencam",
    "set": "application/set",
    "sgml": "text/sgml",
    "sh": "application/x-sh",
    "shar": "application/x-shar",
    "silo": "model/mesh",
    "sit": "application/x-stuffit",
    "skt": "application/x-koan",
    "smil": "application/smil",
    "snd": "audio/basic",
    "sol": "application/solids",
    "spl": "application/x-futuresplash",
    "src": "application/x-wais-source",
    "stl": "application/SLA",
    "stp": "application/STEP",
    "sv4cpio": "application/x-sv4cpio",
    "sv4crc": "application/x-sv4crc",
    "svg": "image/svg+xml",
    "swf": "application/x-shockwave-flash",
    "tar": "application/x-tar",
    "tcl": "application/x-tcl",
    "tex": "application/x-tex",
    "texinfo": "application/x-texinfo",
    "tgz": "application/x-tar-gz",
    "tiff": "image/tiff",
    "tr": "application/x-troff",
    "tsi": "audio/TSP-audio",
    "tsp": "application/dsptype",
    "tsv": "text/tab-separated-values",
    "txt": "text/plain",
    "unv": "application/i-deas",
    "ustar": "application/x-ustar",
    "vcd": "application/x-cdlink",
    "vda": "application/vda",
    "vivo": "video/vnd.vivo",
    "vrm": "x-world/x-vrml",
    "wav": "audio/x-wav",
    "wax": "audio/x-ms-wax",
    "wma": "audio/x-ms-wma",
    "wmv": "video/x-ms-wmv",
    "wmx": "video/x-ms-wmx",
    "wrl": "model/vrml",
    "wvx": "video/x-ms-wvx",
    "xbm": "image/x-xbitmap",
    "xlw": "application/vnd.ms-excel",
    "xml": "text/xml",
    "xpm": "image/x-xpixmap",
    "xwd": "image/x-xwindowdump",
    "xyz": "chemical/x-pdb",
    "zip": "application/zip",
    "*": "application/octect-stream"
};

exports.mimeTypes = mimeTypes;
};

__modules[14] = function(exports) {
/*

== Notes ==

- With this approach, we can't have cyclic dependencies.  But there are
  many other restrictions as well.  They may be lifted at some point in
  the future.

*/

var __this = this; var Parser = __require(16);

var FILENAME = /^[^\.\/\\][\s\S]*?\.[^\s\.]+$/;

function requireCall(url) {

    return "require(" + JSON.stringify(url) + ")";
}

var Replacer = es6now.Class(null, function(__super) { return {

    constructor: function() {
        
        this.requireCall = requireCall;
    },
    
    replace: function(input) { var __this = this; 
    
        this.exports = {};
        this.imports = {};
        this.dependencies = [];
        this.uid = 0;
        this.input = input;

        var root = Parser.parseModule(input);
        
        var visit = (function(node) {
        
            // Perform a depth-first traversal
            Parser.forEachChild(node, (function(child) {
            
                child.parentNode = node;
                visit(child);
            }));
            
            node.text = __this.stringify(node);
            
            // Call replacer
            if (__this[node.type]) {
            
                var replaced = __this[node.type](node);
                
                node.text = (replaced === undefined || replaced === null) ?
                    __this.stringify(node) :
                    replaced;
            }
            
            return node.text;
        });
        
        return visit({ 
        
            type: "$", 
            root: root, 
            start: 0, 
            end: input.length
        });
    },

    DoWhileStatement: function(node) {
    
        if (node.text.slice(-1) !== ";")
            return node.text + ";";
    },
    
    Module: function(node) {
    
        if (node.createThisBinding)
            return "var __this = this; " + node.text;
    },
    
    Script: function(node) {
    
        if (node.createThisBinding)
            return "var __this = this; " + node.text;
    },
    
    FunctionBody: function(node) {
    
        if (node.parentNode.createThisBinding)
            return "{ var __this = this; " + node.text.slice(1);
    },
    
    ExpressionStatement: function(node) {
    
        // Remove 'use strict' directives (will be added to head of output)
        if (node.directive === "use strict")
            return "";
    },
    
    VariableDeclaration: function(node) {
    
        // TODO?  Per-iteration bindings mean that we'll need to use
        // the try { throw void 0; } catch (x) {} trick.  Worth it?
    },
    
    MethodDefinition: function(node) {
    
        // TODO: Generator methods
        
        // TODO: will fail if name is a string:  static "name"() {}
        if (node.static)
            node.name.text = "__static_" + node.name.text;
        
        if (!node.accessor)
            return node.name.text + ": function(" + this.joinList(node.params) + ") " + node.body.text;
    },
    
    PropertyDefinition: function(node) {
    
        if (node.expression === null)
            return node.name.text + ": " + node.name.text;
    },
    
    ModuleAlias: function(node) {
    
        var spec = node.specifier;
        
        var expr = spec.type === "String" ?
            this.requireCall(this.requirePath(spec.value)) :
            spec.text;
        
        return "var " + node.ident.text + " = " + expr + ";";
    },
    
    ModuleDeclaration: function(node) {
    
        // TODO: Inline modules
    },
    
    ModuleRegistration: function(node) {
    
        // TODO: Pre-loaded modules
    },
    
    ImportDeclaration: function(node) {
    
        var binding = node.binding,
            from = node.from,
            moduleSpec,
            out = "",
            tmp;
        
        moduleSpec = from.type === "String" ?
            this.requireCall(this.requirePath(from.value)) :
            from.text;
        
        if (binding.type === "Identifier") {
        
            out = "var " + binding.text + " = " + moduleSpec + "." + binding.text + ";";
            
        } else if (binding.type === "ImportSpecifierSet") {
        
            tmp = "_M" + (this.uid++);
            out = "var " + tmp + " = " + moduleSpec;
            
            binding.specifiers.forEach((function(spec) {
            
                var name = spec.name,
                    ident = spec.ident || name;
                
                out += ", " + ident.text + " = " + tmp + "." + name.text;
            }));
            
            out += ";";
        }
        
        return out;
    },
    
    ExportDeclaration: function(node) {
    
        var binding = node.binding,
            bindingType = binding ? binding.type : "*",
            exports = this.exports,
            ident;
        
        // Exported declarations
        switch (bindingType) {
        
            case "VariableDeclaration":
            
                binding.declarations.forEach((function(decl) {
            
                    // TODO: Destructuring!
                    ident = decl.pattern.text;
                    exports[ident] = ident;
                }));
                
                return binding.text + ";";
            
            case "FunctionDeclaration":
            case "ClassDeclaration":
            
                ident = binding.ident.text;
                exports[ident] = ident;
                return binding.text;
        }
        
        var from = node.from,
            fromPath = "",
            out = "";
        
        if (from) {
        
            if (from.type === "String") {
            
                fromPath = "_M" + (this.uid++);
                out = "var " + fromPath + " = " + this.requireCall(this.requirePath(from.value)) + "; ";
            
            } else {
            
                fromPath = node.from.text;
            }
        }
        
        // Exported bindings
        switch (bindingType) {
        
            case "*":
            
                if (from) {
                
                    out += "Object.keys(" + fromPath + ").forEach(function(k) { exports[k] = " + fromPath + "[k]; });";
                    
                } else {
                
                    // TODO:
                    throw new Error("`export *;` is not implemented.");
                }
                
                break;
                
            case "Identifier":
            
                ident = binding.text;
                exports[ident] = from ? (fromPath + "." + ident) : ident;
                break;
            
            default:
            
                binding.specifiers.forEach((function(spec) {
            
                    var ident = spec.ident.text,
                        path = spec.path ? spec.path.text : ident;
                    
                    exports[ident] = from ? 
                        fromPath + "." + path :
                        path;
                }));
                
                break;
        }
        
        return out;
    },
    
    CallExpression: function(node) {
    
        var callee = node.callee,
            args = node.arguments;
        
        // Translate CommonJS require calls
        if (callee.type === "Identifier" && 
            callee.value === "require" &&
            args.length === 1 &&
            args[0].type === "String") {
        
            return this.requireCall(this.requirePath(args[0].value));
        }
        
        if (node.isSuperCall) {
        
            var argText = "this";
            
            if (args.length > 0)
                argText += ", " + this.joinList(args);
            
            // TODO: what if callee is of the form super["abc"]?
            return callee.text + ".call(" + argText + ")";
        }
    },
    
    SuperExpression: function(node) {
    
        var p = node.parentNode;
        
        if (p.type === "CallExpression") {
        
            p.isSuperCall = true;
            
            var m = this.parentFunction(p),
                name = (m.type === "MethodDefinition" ? m.name.text : "constructor");
            
            // TODO: what if method name is not an identifier?
            return "__super." + name;
        }
        
        p = p.parentNode;
        
        if (p.type === "CallExpression")
            p.isSuperCall = true;
        
        return "__super";
    },
    
    ArrowFunction: function(node) {
    
        var head, body, expr;
        
        head = "function(" + this.joinList(node.params) + ")";
        
        if (node.body.type === "FunctionBody") {
        
            body = node.body.text;
        
        } else {
        
            body = "{ return " + node.body.text + "; }";
        }

        return "(" + head + " " + body + ")";
    },
    
    ThisExpression: function(node) {
    
        var fn = this.parentFunction(node);
        
        if (fn.type === "ArrowFunction") {
        
            while (fn = this.parentFunction(fn))
                if (fn.type !== "ArrowFunction")
                    fn.createThisBinding = true;
            
            return "__this";
        }
    },
    
    ClassDeclaration: function(node) {
    
        var name = node.ident ? ("var " + node.ident.text + " = ") : "";
        
        return name + "es6now.Class(" + 
            (node.base ? node.base.text : "null") + ", " +
            "function(__super) { return " +
            node.body.text + "});";
    },
    
    ClassExpression: function(node) {
    
        // TODO:  named class expressions aren't currently supported
        
        return "es6now.Class(" + 
            (node.base ? node.base.text : "null") + ", " +
            "function(__super) { return" +
            node.body.text + "})";
    },
    
    ClassBody: function(node) {
    
        var elems = node.elements, 
            e,
            i;
        
        for (i = elems.length; i--;) {
        
            e = elems[i];
            
            if (e.static)
                e.text = e.text.replace(/^static\s+/, "");
            
            if (i < elems.length - 1)
                e.text += ",";
        }
    },
    
    TemplateExpression: function(node) {
    
        var lit = node.literals,
            sub = node.substitutions,
            out = "",
            i;
        
        for (i = 0; i < lit.length; ++i) {
        
            if (i > 0)
                out += " + (" + sub[i - 1].text + ") + ";
            
            out += JSON.stringify(lit[i].value);
        }
        
        return out;
    },
    
    parentFunction: function(node) {
    
        for (var p = node.parentNode; p; p = p.parentNode) {
        
            switch (p.type) {
            
                case "ArrowFunction":
                case "FunctionDeclaration":
                case "FunctionExpression":
                case "MethodDefinition":
                case "Script":
                case "Module":
                    return p;
            }
        }
        
        return null;
    },
    
    hasThisRef: function(node) {
    
        var hasThis = {};
        
        try { 
        
            visit(node);
        
        } catch (err) { 
        
            if (err === hasThis) return true; 
            else throw err;
        }
        
        return false;
        
        function visit(node) {
        
            if (node.type === "FunctionExpression" || 
                node.type === "FunctionDeclaration")
                return;
            
            if (node.type === "ThisExpression")
                throw hasThis;
            
            Parser.forEachChild(node, visit);
        }
    },
    
    requirePath: function(url) {
    
        // If this is a simple local filename, then add "./" prefix
        // so that Node will not treat it as a package
        if (FILENAME.test(url))
            url = "./" + url;
        
        // Add to dependency list
        if (this.imports[url] !== true) {
        
            this.imports[url] = true;
            this.dependencies.push(url);
        }
        
        return url;
    },
    
    stringify: function(node) {
        
        var offset = node.start,
            input = this.input,
            text = "";
        
        // Build text from child nodes
        Parser.forEachChild(node, (function(child) {
        
            if (offset < child.start)
                text += input.slice(offset, child.start);
            
            text += child.text;
            offset = child.end;
        }));
        
        if (offset < node.end)
            text += input.slice(offset, node.end);
        
        return text;
    },
    
    joinList: function(list) {
    
        var input = this.input,
            offset = -1, 
            text = "";
        
        list.forEach((function(child) {
        
            if (offset >= 0 && offset < child.start)
                text += input.slice(offset, child.start);
            
            text += child.text;
            offset = child.end;
        }));
        
        return text;
    }

}});

exports.Replacer = Replacer;
};

__modules[15] = function(exports) {
/*

Provides basic support for methods added in EcmaScript 5 for EcmaScript 4 browsers.
The intent is not to create 100% spec-compatible replacements, but to allow the use
of basic ES5 functionality with predictable results.  There are features in ES5 that
require an ES5 engine (freezing an object, for instance).  If you plan to write for 
legacy engines, then don't rely on those features.

*/

var global = this,
    OP = Object.prototype,
    HOP = OP.hasOwnProperty,
    slice = Array.prototype.slice,
    TRIM_S = /^\s+/,
    TRIM_E = /\s+$/,
    FALSE = function() { return false; },
    TRUE = function() { return true; },
    identity = function(o) { return o; },
    defGet = OP.__defineGetter__,
    defSet = OP.__defineSetter__,
    keys = Object.keys || es4Keys,
    ENUM_BUG = !function() { var o = { constructor: 1 }; for (var i in o) return i = true; }(),
    ENUM_BUG_KEYS = [ "toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor" ],
    ERR_REDUCE = "Reduce of empty array with no initial value";

// Returns the internal class of an object
function getClass(o) {

    if (o === null || o === undefined) return "Object";
    return OP.toString.call(o).slice("[object ".length, -1);
}

// Returns an array of keys defined on the object
function es4Keys(o) {

    var a = [], i;
    
    for (i in o)
        if (HOP.call(o, i))
            a.push(i);
    
    if (ENUM_BUG) 
        for (i = 0; i < ENUM_BUG_KEYS.length; ++i)
            if (HOP.call(o, ENUM_BUG_KEYS[i]))
                a.push(ENUM_BUG_KEYS[i]);
    
    return a;
}

// Sets a collection of keys, if the property is not already set
function addKeys(o, p) {

    for (var i = 0, a = keys(p), k; i < a.length; ++i) {
    
        k = a[i];
        
        if (o[k] === undefined) 
            o[k] = p[k];
    }
    
    return o;
}

// Emulates an ES5 environment
function emulate() {

    // In IE8, defineProperty and getOwnPropertyDescriptor only work on DOM objects
    // and are therefore useless - so bury them.
    try { (Object.defineProperty || FALSE)({}, "-", { value: 0 }); }
    catch (x) { Object.defineProperty = undefined; };
    
    try { (Object.getOwnPropertyDescriptor || FALSE)({}, "-"); }
    catch (x) { Object.getOwnPropertyDescriptor = undefined; }
    
    // In IE < 9 [].slice does not work properly when the start or end arguments are undefined.
    try { [0].slice(0, undefined)[0][0]; }
    catch (x) {
    
        Array.prototype.slice = function(s, e) {
        
            s = s || 0;
            return (e === undefined ? slice.call(this, s) : slice.call(this, s, e));
        };
    }
    
    // ES5 Object functions
    addKeys(Object, {
    
        create: function(o, p) {
        
            var n;
            
            if (o === null) {
            
                n = { "__proto__": o };
            
            } else {
            
                var f = function() {};
                f.prototype = o;
                n = new f;
            }
            
            if (p !== undefined)
                Object.defineProperties(n, p);
            
            return n;
        },
        
        keys: keys,
        
        getOwnPropertyDescriptor: function(o, p) {
        
            if (!HOP.call(o, p))
                return undefined;
            
            return { 
                value: o[p], 
                writable: true, 
                configurable: true, 
                enumerable: OP.propertyIsEnumerable.call(o, p)
            };
        },
        
        defineProperty: function(o, n, p) {
        
            var msg = "Accessor properties are not supported.";
            
            if ("get" in p) {
            
                if (defGet) defGet(n, p.get);
                else throw new Error(msg);
            }
            
            if ("set" in p) {
            
                if (defSet) defSet(n, p.set);
                else throw new Error(msg);
            }
            
            if ("value" in p)
                o[n] = p.value;
            
            return o;
        },
        
        defineProperties: function(o, d) {
        
            Object.keys(d).forEach(function(k) { Object.defineProperty(o, k, d[k]); });
            return o;
        },
        
        getPrototypeOf: function(o) {
        
            var p = o.__proto__ || o.constructor.prototype;
            if (p) return p;
            throw new Error("Object.getPrototypeOf is not supported.");
        },
        
        /*
        
        getOwnPropertyNames is not supported since there is no way to 
        get non-enumerable ES3 properties.  However, we don't provide a 
        throwing function so that users can fallback to Object.keys if
        they choose.
        
        */
        
        freeze: identity,
        seal: identity,
        preventExtensions: identity,
        isFrozen: FALSE,
        isSealed: FALSE,
        isExtensible: TRUE
        
    });
    
    
    // Add ES5 String extras
    addKeys(String.prototype, {
    
        trim: function() { return this.replace(TRIM_S, "").replace(TRIM_E, ""); }
    });
    
    
    // Add ES5 Array extras
    addKeys(Array, {
    
        isArray: function(obj) { return getClass(obj) === "Array"; }
    });
    
    
    addKeys(Array.prototype, {
    
        indexOf: function(v, i) {
        
            var len = this.length >>> 0;
            
            i = i || 0;
            if (i < 0) i = Math.max(len + i, 0);
            
            for (; i < len; ++i)
                if (this[i] === v)
                    return i;
            
            return -1;
        },
        
        lastIndexOf: function(v, i) {
        
            var len = this.length >>> 0;
            
            i = Math.min(i || 0, len - 1);
            if (i < 0) i = len + i;
            
            for (; i >= 0; --i)
                if (this[i] === v)
                    return i;
            
            return -1;
        },
        
        every: function(fn, self) {
        
            var r = true;
            
            for (var i = 0, len = this.length >>> 0; i < len; ++i)
                if (i in this && !(r = fn.call(self, this[i], i, this)))
                    break;
            
            return !!r;
        },
        
        some: function(fn, self) {
        
            var r = false;
            
            for (var i = 0, len = this.length >>> 0; i < len; ++i)
                if (i in this && (r = fn.call(self, this[i], i, this)))
                    break;
            
            return !!r;
        },
        
        forEach: function(fn, self) {
        
            for (var i = 0, len = this.length >>> 0; i < len; ++i)
                if (i in this)
                    fn.call(self, this[i], i, this);
        },
        
        map: function(fn, self) {
        
            var a = [];
            
            for (var i = 0, len = this.length >>> 0; i < len; ++i)
                if (i in this)
                    a[i] = fn.call(self, this[i], i, this);
            
            return a;
        },
        
        filter: function(fn, self) {
        
            var a = [];
            
            for (var i = 0, len = this.length >>> 0; i < len; ++i)
                if (i in this && fn.call(self, this[i], i, this))
                    a.push(this[i]);
            
            return a;
        },
        
        reduce: function(fn) {
        
            var len = this.length >>> 0,
                i = 0, 
                some = false,
                ini = (arguments.length > 1),
                val = (ini ? arguments[1] : this[i++]);
            
            for (; i < len; ++i) {
            
                if (i in this) {
                
                    some = true;
                    val = fn(val, this[i], i, this);
                }
            }
            
            if (!some && !ini)
                throw new TypeError(ERR_REDUCE);
            
            return val;
        },
        
        reduceRight: function(fn) {
        
            var len = this.length >>> 0,
                i = len - 1,
                some = false,
                ini = (arguments.length > 1),
                val = (ini || i < 0  ? arguments[1] : this[i--]);
            
            for (; i >= 0; --i) {
            
                if (i in this) {
                
                    some = true;
                    val = fn(val, this[i], i, this);
                }
            }
            
            if (!some && !ini)
                throw new TypeError(ERR_REDUCE);
            
            return val;
        }
    });
    
    // Add ES5 Function extras
    addKeys(Function.prototype, {
    
        bind: function(self) {
        
            var f = this,
                args = slice.call(arguments, 1),
                noargs = (args.length === 0);
            
            bound.prototype = f.prototype;
            return bound;
            
            function bound() {
            
                return f.apply(
                    this instanceof bound ? this : self, 
                    noargs ? arguments : args.concat(slice.call(arguments, 0)));
            }
        }
    });
    
    // Add ES5 Date extras
    addKeys(Date, {
    
        now: function() { return (new Date()).getTime(); }
    });
    
    // Add ES5 Date extras
    addKeys(Date.prototype, {
    
        toISOString: function() {
        
            function pad(s) {
            
                if ((s = "" + s).length === 1) s = "0" + s;
                return s;
            }
            
            return this.getUTCFullYear() + "-" +
                pad(this.getUTCMonth() + 1, 2) + "-" +
                pad(this.getUTCDate(), 2) + "T" +
                pad(this.getUTCHours(), 2) + ":" +
                pad(this.getUTCMinutes(), 2) + ":" +
                pad(this.getUTCSeconds(), 2) + "Z";
        },
        
        toJSON: function() {
        
            return this.toISOString();
        }
    });
    
    // Add ISO support to Date.parse
    if (Date.parse(new Date(0).toISOString()) !== 0) !function() {
    
        /*
        
        In ES5 the Date constructor will also parse ISO dates, but overwritting 
        the Date function itself is too far.  Note that new Date(isoDateString)
        is not backward-compatible.  Use the following instead:
        
        new Date(Date.parse(dateString));
        
        1: +/- year
        2: month
        3: day
        4: hour
        5: minute
        6: second
        7: fraction
        8: +/- tz hour
        9: tz minute
        
        */
        
        var isoRE = /^(?:((?:[+-]\d{2})?\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{3})?)?)?(?:Z|([-+]\d{2}):(\d{2}))?$/,
            dateParse = Date.parse;
    
        Date.parse = function(s) {
        
            var t, m, hasDate, i, offset;
            
            if (!isNaN(t = dateParse(s)))
                return t;
            
            if (s && (m = isoRE.exec(s))) {
            
                hasDate = m[1] !== undefined;
                
                // Convert matches to numbers (month and day default to 1)
                for (i = 1; i <= 9; ++i)
                    m[i] = Number(m[i] || (i <= 3 ? 1 : 0));
                
                // Calculate ms directly if no date is provided
                if (!hasDate)
                    return ((m[4] * 60 + m[5]) * 60 + m[6]) * 1000 + m[7];
                
                // Convert month to zero-indexed
                m[2] -= 1;
                
                // Get TZ offset
                offset = (m[8] * 60 + m[9]) * 60 * 1000;
                
                // Remove full match from array
                m.shift();
                
                t = Date.UTC.apply(this, m) + offset;
            }
            
            return t;
        };
                
    }();
    
    // Add JSON object
    if (typeof JSON === "undefined") global.JSON = (function() {
    
        var TOK = /[\[\]}{:,]|null|true|false|-?\d+(\.\d+)?([eE][+-]?\d+)?|"([^"\\]|\\[\s\S])*"|\s+/g,
            ESC = /[\\\"\x00-\x1F\u0080-\uFFFF]/g;
        
        function parse(s) {
        
            if (s.replace(TOK, "").length > 0)
                throw new Error("JSON syntax error.");
            
            try { return (new Function("return (" + s + ");"))(); }
            catch (x) { throw new Error("JSON sytax error."); }
        }
        
        function esc(s) {
        
            switch (s) {
            
                case "\b": return "\\b";
                case "\t": return "\\t";
                case "\n": return "\\n";
                case "\f": return "\\f";
                case "\r": return "\\r";
                case '"': return '\\"';
                case "\\": return "\\\\";
                default: return "\\u" + ("0000" + s.charCodeAt(0).toString(16)).slice(-4);
            }
        }
        
        function tos(o) {
        
            var i, a;
            
            switch (typeof o) {
            
                case "string":
                    return "\"" + o.replace(ESC, esc) + "\"";
                    
                case "boolean":
                    return o ? "true" : "false";
                    
                case "number":
                    return isFinite(o) ? o.toString() : "null";
                    
                case "object":
                
                    if (!o) {
                    
                        return "null";
                    
                    } else if (Array.isArray(o)) {
                    
                        for (a = [], i = 0; i < o.length; ++i) 
                            a.push(tos(o[i]));
                        
                        return "[" + a.join(",") + "]";
                    
                    } else if (o.toJSON) {
                    
                        return tos(o.toJSON());
                    
                    } else {
                    
                        for (a = Object.keys(o), i = 0; i < a.length; ++i)
                            a[i] = tos(a[i]) + ":" + tos(o[a[i]]);
                        
                        return "{" + a.join(",") + "}";
                    }
                    
            }
            
            throw new Error("Cannot convert object to JSON string.");
        }
        
        return { parse: parse, stringify: tos };
        
    })();
}

exports.addKeys = addKeys;
exports.emulate = emulate;
};

__modules[16] = function(exports) {
var _M0 = __require(17); Object.keys(_M0).forEach(function(k) { exports[k] = _M0[k]; });
};

__modules[17] = function(exports) {
var Node = __require(18);
var Parser = __require(19).Parser;
var Scanner = __require(20).Scanner;



function parseModule(input, options) {

    return new Parser(input, options).parseModule();
}

function parseScript(input, options) {

    return new Parser(input, options).parseScript();
}

function forEachChild(node, fn) {

    var keys = Object.keys(node), val, i, j;
    
    for (i = 0; i < keys.length; ++i) {
    
        if (keys[i] === "parentNode")
            continue;
            
        val = node[keys[i]];
        
        // Skip non-objects
        if (!val || typeof val !== "object") 
            continue;
        
        if (typeof val.type === "string") {
        
            // Nodes have a "type" property
            fn(val);
        
        } else {
        
            // Iterate arrays
            for (j = 0; j < (val.length >>> 0); ++j)
                if (val[j] && typeof val[j].type === "string")
                    fn(val[j]);
        }
    }
}


exports.Parser = Parser;
exports.Scanner = Scanner;
exports.Node = Node;
exports.parseModule = parseModule;
exports.parseScript = parseScript;
exports.forEachChild = forEachChild;
};

__modules[18] = function(exports) {

var Identifier = es6now.Class(null, function(__super) { return {

    constructor: function(value, context, start, end) {
    
        this.type = "Identifier";
        this.value = value;
        this.context = context;
        this.start = start;
        this.end = end;
    }
}});

var Number = es6now.Class(null, function(__super) { return {

    constructor: function(value, start, end) {
    
        this.type = "Number";
        this.value = value;
        this.start = start;
        this.end = end;
    }
}});

var String = es6now.Class(null, function(__super) { return {

    constructor: function(value, start, end) {
    
        this.type = "String";
        this.value = value;
        this.start = start;
        this.end = end;
    }
}});

var Template = es6now.Class(null, function(__super) { return {

    constructor: function(value, isEnd, start, end) {
    
        this.type = "Template";
        this.value = value;
        this.templateEnd = isEnd;
        this.start = start;
        this.end = end;
    }
}});

var RegularExpression = es6now.Class(null, function(__super) { return {

    constructor: function(value, flags, start, end) {
    
        this.type = "RegularExpression";
        this.value = value;
        this.flags = flags;
        this.start = start;
        this.end = end;
    }
}});

var Null = es6now.Class(null, function(__super) { return {

    constructor: function(start, end) {
    
        this.type = "Null";
        this.start = start;
        this.end = end;
    }
}});

var Boolean = es6now.Class(null, function(__super) { return {

    constructor: function(value, start, end) {
    
        this.type = "Boolean";
        this.value = value;
        this.start = start;
        this.end = end;
    }
}});

var ThisExpression = es6now.Class(null, function(__super) { return {

    constructor: function(start, end) {
    
        this.type = "ThisExpression";
        this.start = start;
        this.end = end;
    }
}});

var SuperExpression = es6now.Class(null, function(__super) { return {

    constructor: function(start, end) {
    
        this.type = "SuperExpression";
        this.start = start;
        this.end = end;
    }
}});
exports.Identifier = Identifier;
exports.Number = Number;
exports.String = String;
exports.Template = Template;
exports.RegularExpression = RegularExpression;
exports.Null = Null;
exports.Boolean = Boolean;
exports.ThisExpression = ThisExpression;
exports.SuperExpression = SuperExpression;
};

__modules[19] = function(exports) {
var Node = __require(18);

var Scanner = __require(20).Scanner;
var Transform = __require(21).Transform;
var Validate = __require(22).Validate;

// Binary operator precedence levels
var operatorPrecedence = {

    "||": 1,
    "&&": 2,
    "|": 3,
    "^": 4,
    "&": 5,
    "==": 6, "!=": 6, "===": 6, "!==": 6,
    "<=": 7, ">=": 7, ">": 7, "<": 7, "instanceof": 7, "in": 7,
    ">>>": 8, ">>": 8, "<<": 8,
    "+": 9, "-": 9,
    "*": 10, "/": 10, "%": 10
};

// Object literal property name flags
var PROP_NORMAL = 1,
    PROP_ASSIGN = 2,
    PROP_GET = 4,
    PROP_SET = 8;

// Returns true if the specified operator is an increment operator
function isIncrement(op) {

    return op === "++" || op === "--";
}

// Returns true if the specified operator is an assignment operator
function isAssignment(op) {

    if (op === "=")
        return true;
    
    switch (op) {
    
        case "*=": 
        case "&=": 
        case "^=": 
        case "|=": 
        case "<<=": 
        case ">>=": 
        case ">>>=": 
        case "%=": 
        case "+=": 
        case "-=": 
        case "/=":
            return true;
    }
    
    return false;
}

// Returns true if the specified operator is a unary operator
function isUnary(op) {
    
    switch (op) {
    
        case "delete":
        case "void": 
        case "typeof":
        case "!":
        case "~":
        case "+":
        case "-":
            return true;
    }
    
    return false;
}

// Returns a copy of the specified token
function copyToken(token) {

    return {
        type: token.type,
        value: token.value,
        newlineBefore: token.newlineBefore,
        start: token.start,
        end: token.end,
        regexFlags: token.regexFlags,
        templateEnd: token.templateEnd
    };
}

// Adds methods to the Parser prototype
function mixin(source) {

    Object.keys(source.prototype).forEach((function(k) { 
    
        Parser.prototype[k] = source.prototype[k];
    }));
}

var Parser = es6now.Class(null, function(__super) { return {

    constructor: function(input, offset) {

        var scanner = new Scanner(input, offset);
            
        this.scanner = scanner;
        this.input = input;
        
        this.peek0 = null;
        this.peek1 = null;
        this.endOffset = scanner.offset;
        
        this.contextStack = [];
        this.pushContext(false);
    },

    get startOffset() {
    
        return this.peekToken().start;
    },
    
    parseScript: function() { 
    
        return this.Script();
    },
    
    parseModule: function() {
    
        return this.Module();
    },
    
    nextToken: function(context) {
    
        var scanner = this.scanner,
            type = null;
        
        while (!type || type === "COMMENT")
            type = scanner.next(context);
        
        return scanner;
    },
    
    readToken: function(type, context) {
    
        var token = this.peek0 || this.nextToken(context);
        
        this.peek0 = this.peek1;
        this.peek1 = null;
        this.endOffset = token.end;
        
        if (type && token.type !== type)
            this.fail("Unexpected token " + token.type, token);
        
        return token;
    },
    
    read: function(type, context) {
    
        return this.readToken(type, context).type;
    },
    
    peekToken: function(context, index) {
    
        if (index === 0 || index === void 0) {
        
            return this.peek0 || (this.peek0 = this.nextToken(context));
        
        } else if (index === 1) {
        
            if (this.peek1) {
            
                return this.peek1;
            
            } else if (this.peek0) {
            
                this.peek0 = copyToken(this.peek0);
                return this.peek1 = this.nextToken(context);
            }
        }
        
        throw new Error("Invalid lookahead");
    },
    
    peek: function(context, index) {
    
        return this.peekToken(context, index).type;
    },
    
    unpeek: function() {
    
        if (this.peek0) {
        
            this.scanner.offset = this.peek0.start;
            this.peek0 = null;
            this.peek1 = null;
        }
    },
    
    peekUntil: function(type, context) {
    
        var tok = this.peek(context);
        return tok !== "EOF" && tok !== type ? tok : null;
    },
    
    fail: function(msg, loc) {
    
        var pos = this.scanner.position(loc || this.peek0),
            err = new SyntaxError(msg);
        
        err.position = pos;
        throw err;
    },
    
    readKeyword: function(word) {
    
        var token = this.readToken();
        
        if (token.type === word || (token.type === "IDENTIFIER" && token.value === word))
            return token;
        
        this.fail("Unexpected token " + token.type, token);
    },
    
    peekKeyword: function(word, noNewlineBefore) {
    
        var token = this.peekToken();
        
        if (token.type === word)
            return true;
        
        return  token.type === word ||
                token.type === "IDENTIFIER" && 
                token.value === word && 
                !(noNewlineBefore && token.newlineBefore);
    },
    
    // Context management
    pushContext: function(isFunction, isStrict) {
    
        this.context = { 
            
            strict: isStrict || (this.context ? this.context.strict : false),
            isFunction: isFunction,
            labelSet: {},
            switchDepth: 0,
            invalidNodes: null
        };
        
        this.contextStack.push(this.context);
        this.scanner.strict = this.context.strict;
    },
    
    popContext: function() {
    
        this.contextStack.pop();
        this.context = this.contextStack[this.contextStack.length - 1];
        this.scanner.strict = this.context ? this.context.strict : false;
    },
    
    setStrict: function() {
    
        this.context.strict = true;
        this.scanner.strict = true;
    },
    
    maybeEnd: function() {
    
        var token = this.peekToken();
        
        if (!token.newlineBefore) {
            
            switch (token.type) {
            
                case "EOF":
                case "}":
                case ";":
                    break;
                
                default:
                    return true;
            }
        }
        
        return false;
    },
    
    peekModule: function(allowURL) {
    
        if (this.peekToken().value === "module") {
        
            var p = this.peekToken("div", 1);
            
            if (!p.newlineBefore) {
            
                switch (p.type) {
                
                    case "IDENTIFIER": return true;
                    case "STRING": return allowURL;
                }
            }
        }
        
        return false;
    },
    
    addInvalidNode: function(node, error) {
    
        var context = this.context,
            list = context.invalidNodes;
        
        node.error = error;
        
        if (!list) context.invalidNodes = [node];
        else list.push(node);
    },
    
    // === Top Level ===
    
    Script: function() {
    
        var start = this.startOffset,
            statements = this.StatementList(true, false);
        
        return { 
            type: "Script", 
            statements: statements,
            start: start,
            end: this.endOffset
        };
    },
    
    Module: function() {
    
        // Modules are always strict
        this.setStrict();
        
        var start = this.startOffset,
            statements = this.StatementList(true, true);
        
        return { 
            type: "Module", 
            statements: statements,
            start: start,
            end: this.endOffset
        };
    },
    
    // === Expressions ===
    
    Expression: function(noIn) {
    
        var start = this.startOffset,
            expr = this.AssignmentExpression(noIn),
            list = null;
            
        while (this.peek("div") === ",") {
        
            // If the next token after "," is "...", we might be
            // trying to parse an arrow function formal parameter
            // list with a trailing rest parameter.  Return the 
            // expression up to, but not including ",".
            
            if (this.peek(null, 1) === "...")
                break;
            
            this.read();
            
            if (list === null) {
            
                list = [expr];
                
                expr = { 
                    type: "SequenceExpression", 
                    expressions: list, 
                    start: start,
                    end: -1
                };
            }
            
            list.push(this.AssignmentExpression(noIn));
        }
        
        if (list)
            expr.end = this.endOffset;
        
        return expr;
    },
    
    AssignmentExpression: function(noIn) {
    
        var start = this.startOffset,
            left,
            lhs;
        
        if (this.peek() === "yield")
            return this.YieldExpression();
        
        left = this.ConditionalExpression(noIn);
        
        // Check for assignment operator
        if (!isAssignment(this.peek("div")))
            return left;
        
        // Binding forms can be contained within parens
        for (lhs = left; lhs.type === "ParenExpression"; lhs = lhs.expression);
        
        // Make sure that left hand side is assignable
        switch (lhs.type) {
        
            case "MemberExpression":
            case "CallExpression":
                break;
                
            case "Identifier":
                this.checkAssignTarget(lhs);
                break;
        
            default:
                this.transformPattern(lhs, false);
                break;
        }
        
        return {
        
            type: "AssignmentExpression",
            operator: this.read(),
            left: left,
            right: this.AssignmentExpression(noIn),
            start: start,
            end: this.endOffset
        };
    },
    
    SpreadAssignment: function(noIn) {
    
        if (this.peek() === "...") {
        
            var start = this.startOffset;
            
            this.read();
            
            return {
                type: "SpreadExpression",
                expression: this.AssignmentExpression(noIn),
                start: start,
                end: this.endOffset
            };
        }
        
        return this.AssignmentExpression(noIn);
    },
    
    YieldExpression: function() {
    
        this.read("yield");
        
        var delegate = false;
        
        if (this.peek() === "*") {
        
            this.read();
            delegate = true;
        }
        
        return {
            type: "YieldExpression",
            delegate: delegate,
            expression: this.AssignmentExpression()
        };  
    },
    
    ConditionalExpression: function(noIn) {
    
        var start = this.startOffset,
            left = this.BinaryExpression(noIn),
            middle,
            right;
        
        if (this.peek("div") !== "?")
            return left;
        
        this.read("?");
        middle = this.AssignmentExpression();
        this.read(":");
        right = this.AssignmentExpression(noIn);
        
        return {
        
            type: "ConditionalExpression",
            test: left,
            consequent: middle,
            alternate: right,
            start: start,
            end: this.endOffset
        };
    },
    
    BinaryExpression: function(noIn) {
    
        return this.PartialBinaryExpression(this.UnaryExpression(), 0, noIn);
    },
    
    PartialBinaryExpression: function(lhs, minPrec, noIn) {
    
        var prec,
            next, 
            max, 
            rhs,
            op;
        
        while (next = this.peek("div")) {
            
            // Exit if operator is "in" and in is not allowed
            if (next === "in" && noIn)
                break;
            
            prec = operatorPrecedence[next];
            
            // Exit if not a binary operator or lower precendence
            if (prec === void 0 || prec < minPrec)
                break;
            
            this.read();
            
            op = next;
            max = prec;
            rhs = this.UnaryExpression();
            
            while (next = this.peek("div")) {
            
                prec = operatorPrecedence[next];
                
                // Exit if not a binary operator or equal or higher precendence
                if (prec === void 0 || prec <= max)
                    break;
                
                rhs = this.PartialBinaryExpression(rhs, prec, noIn);
            }
            
            lhs = {
            
                type: "BinaryExpression",
                operator: op,
                left: lhs,
                right: rhs,
                start: lhs.start,
                end: rhs.end
            };
        }
        
        return lhs;
    },
    
    UnaryExpression: function() {
    
        var start = this.startOffset,
            type = this.peek(),
            token,
            expr;
        
        if (isIncrement(type)) {
        
            this.read();
            expr = this.MemberExpression(true);
            this.checkAssignTarget(expr);
            
            return {
            
                type: "UpdateExpression", 
                operator: type, 
                expression: expr,
                prefix: true,
                start: start,
                end: this.endOffset
            };
        }
        
        if (isUnary(type)) {
        
            this.read();
            expr = this.UnaryExpression();
            
            if (type === "delete" && this.context.strict && expr.type === "Identifier")
                this.fail("Cannot delete unqualified property in strict mode", expr);
            
            return {
            
                type: "UnaryExpression",
                operator: type,
                expression: expr,
                start: start,
                end: this.endOffset
            };
        }
        
        expr = this.MemberExpression(true);
        token = this.peekToken("div");
        type = token.type;
        
        // Check for postfix operator
        if (isIncrement(type) && !token.newlineBefore) {
        
            this.read();
            this.checkAssignTarget(expr);
            
            return {
            
                type: "UpdateExpression",
                operator: type,
                expression: expr,
                prefix: false,
                start: start,
                end: this.endOffset
            };
        }
        
        return expr;
    },
    
    MemberExpression: function(allowCall) {
    
        var start = this.startOffset,
            type = this.peek(),
            exit = false,
            prop,
            expr;
        
        expr = 
            type === "new" ? this.NewExpression() :
            type === "super" ? this.SuperExpression() :
            this.PrimaryExpression();
        
        while (!exit && (type = this.peek("div"))) {
        
            switch (type) {
            
                case ".":
                
                    this.read();
                    
                    expr = { 
                    
                        type: "MemberExpression", 
                        object: expr, 
                        property: this.IdentifierName(),
                        computed: false,
                        start: start,
                        end: this.endOffset
                    };
                    
                    break;
                
                case "[":
                
                    this.read();
                    prop = this.Expression();
                    this.read("]");
                    
                    expr = { 
                    
                        type: "MemberExpression", 
                        object: expr, 
                        property: prop,
                        computed: true,
                        start: start,
                        end: this.endOffset
                    };
        
                    break;
                
                case "(":
                    
                    if (!allowCall) {
                    
                        exit = true;
                        break;
                    }
                    
                    expr = {
                    
                        type: "CallExpression",
                        callee: expr,
                        arguments: this.ArgumentList(),
                        start: start,
                        end: this.endOffset
                    };
                    
                    break;
                
                case "TEMPLATE":
                
                    expr = {
                    
                        type: "TaggedTemplateExpression",
                        tag: expr,
                        template: this.TemplateExpression(),
                        start: start,
                        end: this.endOffset
                    };
                    
                    break;
                
                default:
                
                    if (expr.type === "SuperExpression")
                        this.fail("Invalid super expression", expr);
                    
                    exit = true;
                    break;
            }
        }
        
        return expr;
    },
    
    NewExpression: function() {
    
        var start = this.startOffset;
        
        this.read("new");
        
        var expr = this.MemberExpression(false),
            args = this.peek("div") === "(" ? this.ArgumentList() : null;
        
        return {
            type: "NewExpression",
            callee: expr,
            arguments: args,
            start: start,
            end: this.endOffset
        };
    },
    
    SuperExpression: function() {
    
        var start = this.startOffset;
        this.read("super");
        
        return new Node.SuperExpression(start, this.endOffset);
    },
    
    ArgumentList: function() {
    
        var list = [];
        
        this.read("(");
        
        while (this.peekUntil(")")) {
        
            if (list.length > 0)
                this.read(",");
            
            list.push(this.SpreadAssignment());
        }
        
        this.read(")");
        
        return list;
    },
    
    PrimaryExpression: function() {
    
        var tok = this.peekToken(),
            type = tok.type,
            start = tok.start;
        
        switch (type) {
            
            case "function": return this.FunctionExpression();
            case "class": return this.ClassExpression();
            case "[": return this.ArrayExpression();
            case "{": return this.ObjectExpression();
            case "(": return this.ParenExpression();
            case "TEMPLATE": return this.TemplateExpression();
            case "NUMBER": return this.Number();
            case "STRING": return this.String();
            
            case "IDENTIFIER":
            
                return this.peek("div", 1) === "=>" ?
                    this.ArrowFunction(this.BindingIdentifier(), null, start) :
                    this.Identifier(true);
            
            case "REGEX":
                this.read();
                return new Node.RegularExpression(tok.value, tok.regexFlags, tok.start, tok.end);
            
            case "null":
                this.read();
                return new Node.Null(tok.start, tok.end);
            
            case "true":
            case "false":
                this.read();
                return new Node.Boolean(type === "true", tok.start, tok.end);
            
            case "this":
                this.read();
                return new Node.ThisExpression(tok.start, tok.end);
        }
        
        this.fail("Unexpected token " + type);
    },
    
    Identifier: function(isVar) {
    
        var token = this.readToken("IDENTIFIER"),
            context = isVar ? "variable" : "";
        
        return new Node.Identifier(token.value, context, token.start, token.end);
    },
    
    IdentifierName: function() {
    
        var token = this.readToken("IDENTIFIER", "name");
        return new Node.Identifier(token.value, "", token.start, token.end);
    },
    
    String: function() {
    
        var token = this.readToken("STRING");
        return new Node.String(token.value, token.start, token.end);
    },
    
    Number: function() {
    
        var token = this.readToken("NUMBER");
        return new Node.Number(token.value, token.start, token.end);
    },
    
    Template: function() {
    
        var token = this.readToken("TEMPLATE", "template");
        return new Node.Template(token.value, token.templateEnd, token.start, token.end);
    },
    
    BindingIdentifier: function() {
    
        var node = this.Identifier();
        
        this.checkBindingIdent(node);
        return node;
    },
    
    BindingPattern: function() {
    
        var node;
        
        switch (this.peek()) { 
        
            case "{":
                node = this.ObjectExpression();
                break;
            
            case "[":
                node = this.ArrayExpression();
                break;
            
            default:
                node = this.BindingIdentifier();
                break;
        }
        
        // Transform expressions to patterns
        if (node.type !== "Identifier")
            this.transformPattern(node, true);
        
        return node;
    },
    
    ParenExpression: function() {

        var start = this.startOffset,
            expr = null,
            rest = null;
        
        this.read("(");
        
        switch (this.peek()) {
        
            // An empty arrow function formal list
            case ")":
                break;
            
            // An arrow function formal list with a single rest parameter
            case "...":
                rest = this.RestParameter();
                break;
            
            // Paren expression
            default:
                expr = this.Expression();
                break;
        }
        
        // Look for generator comprehensions
        if (expr && this.peek() === "for")
            return this.GeneratorComprehension(expr, start);
        
        // Look for a trailing rest formal parameter within an arrow formal list
        if (!rest && this.peek() === "," && this.peek(null, 1) === "...") {
        
            this.read();
            rest = this.RestParameter();
        }
        
        this.read(")");
        
        // Determine whether this is a paren expression or an arrow function
        if (expr === null || rest !== null || this.peek("div") === "=>")
            return this.ArrowFunction(expr, rest, start);
        
        return {
            type: "ParenExpression",
            expression: expr,
            start: start,
            end: this.endOffset
        };
    },
    
    ObjectExpression: function() {
    
        var start = this.startOffset,
            list = [],
            nameSet = {};
        
        this.read("{");
        
        while (this.peekUntil("}", "name")) {
        
            if (list.length > 0)
                this.read(",");
            
            if (this.peek("name") !== "}")
                list.push(this.PropertyDefinition(nameSet));
        }
        
        this.read("}");
        
        return { 
            type: "ObjectExpression", 
            properties: list,
            start: start,
            end: this.endOffset
        };
    },
    
    PropertyDefinition: function(nameSet) {
        
        var start = this.startOffset,
            flag = PROP_NORMAL, 
            node,
            name;
        
        switch (this.peek("name", 1)) {
        
            case "IDENTIFIER":
            case "STRING":
            case "NUMBER":
                
                node = this.MethodDefinition();
                
                switch (node.accessor) {
                
                    case "get": flag = PROP_GET; break;
                    case "set": flag = PROP_SET; break;
                }
                
                break;
            
            case "(":
            
                node = this.MethodDefinition();
                break;
            
            case ":":
                
                flag = PROP_ASSIGN;
                
                node = {
                    type: "PropertyDefinition",
                    name: this.PropertyName(),
                    expression: (this.read(), this.AssignmentExpression()),
                    start: start,
                    end: this.endOffset
                };
                
                break;
            
            case "=":
            
                this.unpeek();
                
                node = {
                    type: "CoveredPatternProperty",
                    name: this.Identifier(),
                    pattern: null,
                    init: (this.read(), this.AssignmentExpression()),
                    start: start,
                    end: this.endOffset
                };
                
                this.addInvalidNode(node, "Invalid property definition in object literal");
                
                break;
                
            default:
            
                // Re-read token as an identifier
                this.unpeek();
            
                node = {
                    type: "PropertyDefinition",
                    name: this.Identifier(),
                    expression: null,
                    start: start,
                    end: this.endOffset
                };
                
                break;
        }
        
        // Check for duplicate names
        if (this.isDuplicateName(flag, nameSet[name = "." + node.name.value]))
            this.addInvalidNode(node, "Duplicate property names in object literal");
        
        // Set name flag
        nameSet[name] |= flag;
        
        return node;
    },
    
    PropertyName: function() {
    
        var type = this.peek("name");
        
        switch (type) {
        
            case "IDENTIFIER": return this.Identifier();
            case "STRING": return this.String();
            case "NUMBER": return this.Number();
        }
        
        this.fail("Unexpected token " + type);
    },
    
    MethodDefinition: function() {
    
        var start = this.startOffset,
            accessor = null,
            isStatic = false,
            gen = false,
            params,
            name;
        
        if (this.peekToken("name").value === "static" &&
            this.peek("name", 1) !== "(") {
        
            isStatic = true;
            this.read();
        }
        
        if (this.peek("name") === "*") {
        
            this.read();
            
            gen = true;
            name = this.PropertyName();
        
        } else {
        
            name = this.PropertyName();
            
            if (name.type === "Identifier" && 
                this.peek("name") !== "(" &&
                (name.value === "get" || name.value === "set")) {
            
                accessor = name.value;
                name = this.PropertyName();
            }
        }
        
        return {
            type: "MethodDefinition",
            static: isStatic,
            generator: gen,
            accessor: accessor,
            name: name,
            params: (params = this.FormalParameters()),
            body: this.FunctionBody(null, params, false),
            start: start,
            end: this.endOffset
        };
    },
    
    ArrayExpression: function() {
    
        var start = this.startOffset,
            list = [],
            comma = false,
            next,
            type;
        
        this.read("[");
        
        while (type = this.peekUntil("]")) {
            
            if (type === "for" && 
                list.length === 1 && 
                next.type !== "SpreadExpression") {
            
                return this.ArrayComprehension(list[0], start);
                
            } else if (type === ",") {
            
                this.read();
                
                if (comma)
                    list.push(null);
                
                comma = true;
            
            } else {
            
                list.push(next = this.SpreadAssignment());
                comma = false;
            }
        }
        
        this.read("]");
        
        return { 
            type: "ArrayExpression", 
            elements: list,
            trailingComma: comma,
            start: start,
            end: this.endOffset
        };
    },
    
    ArrayComprehension: function(expr, start) {
    
        var list = [], 
            test = null;
        
        while (this.peek() === "for")
            list.push(this.ComprehensionFor());
        
        if (this.peek() === "if") {
        
            this.read();
            test = this.Expression();
        }
        
        this.read("]");
        
        return {
            type: "ArrayComprehension",
            expression: expr,
            list: list,
            test: test,
            start: start,
            end: this.endOffset
        };
    },
    
    GeneratorComprehension: function(expr, start) {
    
        var list = [], 
            test = null;
        
        while (this.peek() === "for")
            list.push(this.ComprehensionFor());
        
        if (this.peek() === "if") {
        
            this.read();
            test = this.Expression();
        }
        
        this.read(")");
        
        return {
            type: "GeneratorComprehension",
            expression: expr,
            list: list,
            test: test,
            start: start,
            end: this.endOffset
        };
    },
    
    ComprehensionFor: function() {
    
        this.read("for");
        
        return {
            type: "ComprehensionFor",
            binding: this.BindingPattern(),
            of: (this.readKeyword("of"), this.Expression())
        };
    },
    
    TemplateExpression: function() {
        
        var atom = this.Template(),
            start = atom.start,
            lit = [ atom ],
            sub = [];
        
        while (!atom.templateEnd) {
        
            sub.push(this.Expression());
            
            // Discard any tokens that have been scanned using a different context
            this.unpeek();
            
            lit.push(atom = this.Template());
        }
        
        return { 
            type: "TemplateExpression", 
            literals: lit, 
            substitutions: sub,
            start: start,
            end: this.endOffset
        };
    },
    
    // === Statements ===
    
    Statement: function() {
    
        switch (this.peek()) {
            
            case "IDENTIFIER":
            
                return this.peek("div", 1) === ":" ?
                    this.LabelledStatement() :
                    this.ExpressionStatement();
            
            case "{": return this.Block();
            case ";": return this.EmptyStatement();
            case "var": return this.VariableStatement();
            case "return": return this.ReturnStatement();
            case "break":
            case "continue": return this.BreakOrContinueStatement();
            case "throw": return this.ThrowStatement();
            case "debugger": return this.DebuggerStatement();
            case "if": return this.IfStatement();
            case "do": return this.DoWhileStatement();
            case "while": return this.WhileStatement();
            case "for": return this.ForStatement();
            case "with": return this.WithStatement();
            case "switch": return this.SwitchStatement();
            case "try": return this.TryStatement();
            
            default: return this.ExpressionStatement();
        }
    },
    
    StatementWithLabel: function(label) {
    
        var name = label && label.value || "",
            labelSet = this.context.labelSet,
            stmt;
        
        if (!labelSet[name]) labelSet[name] = 1;
        else if (label) this.fail("Invalid label", label);
        
        labelSet[name] += 1;
        stmt = this.Statement();
        labelSet[name] -= 1;
        
        return stmt;
    },
    
    Block: function() {
        
        var start = this.startOffset;
        
        this.read("{");
        var list = this.StatementList(false);
        this.read("}");
        
        return { 
            type: "Block", 
            statements: list,
            start: start,
            end: this.endOffset
        };
    },
    
    Semicolon: function() {
    
        var token = this.peekToken(),
            type = token.type;
        
        if (type === ";" || !(type === "}" || type === "EOF" || token.newlineBefore))
            this.read(";");
    },
    
    LabelledStatement: function() {
    
        var start = this.startOffset,
            label = this.Identifier();
        
        this.read(":");
        
        return { 
            type: "LabelledStatement", 
            label: label, 
            statement: this.StatementWithLabel(label),
            start: start,
            end: this.endOffset
        };
    },
    
    ExpressionStatement: function() {
    
        var start = this.startOffset,
            expr = this.Expression();
        
        this.Semicolon();
        
        return { 
            type: "ExpressionStatement", 
            expression: expr,
            directive: null,
            start: start,
            end: this.endOffset
        };
    },
    
    EmptyStatement: function() {
    
        var start = this.startOffset;
        
        this.Semicolon();
        
        return { 
            type: "EmptyStatement", 
            start: start,
            end: this.endOffset
        };
    },
    
    VariableStatement: function() {
    
        var node = this.VariableDeclaration(false);
        
        this.Semicolon();
        node.end = this.endOffset;
        
        return node;
    },
    
    VariableDeclaration: function(noIn) {
    
        var start = this.startOffset,
            keyword = this.peek(),
            isConst = false,
            list = [];
        
        switch (keyword) {
        
            case "var":
                break;
            
            case "const":
                isConst = true;
            
            case "let":
                break;
                
            default:
                this.fail("Expected var, const, or let");
        }
        
        this.read();
        
        while (true) {
        
            list.push(this.VariableDeclarator(noIn, isConst));
            
            if (this.peek() === ",") this.read();
            else break;
        }
        
        return { 
            type: "VariableDeclaration", 
            keyword: keyword,
            declarations: list, 
            start: start,
            end: this.endOffset
        };
    },
    
    VariableDeclarator: function(noIn, isConst) {
    
        var start = this.startOffset,
            pattern = this.BindingPattern(),
            init = null;
        
        if (pattern.type !== "Identifier" || this.peek() === "=") {
        
            this.read("=");
            init = this.AssignmentExpression(noIn);
            
        } else if (isConst) {
        
            this.fail("Missing const initializer", pattern);
        }
        
        return { 
            type: "VariableDeclarator", 
            pattern: pattern, 
            init: init,
            start: start,
            end: this.endOffset
        };
    },
    
    ReturnStatement: function() {
    
        if (!this.context.isFunction)
            this.fail("Return statement outside of function");
        
        var start = this.startOffset;
        
        this.read("return");
        var init = this.maybeEnd() ? this.Expression() : null;
        
        this.Semicolon();
        
        return { 
            type: "ReturnStatement", 
            argument: init,
            start: start,
            end: this.endOffset
        };
    },
    
    BreakOrContinueStatement: function() {
    
        var start = this.startOffset,
            token = this.readToken(),
            keyword = token.type,
            labelSet = this.context.labelSet,
            label;
        
        label = this.maybeEnd() ? this.Identifier() : null;
        
        this.Semicolon();
        
        if (label) {
        
            if (!labelSet[label.value])
                this.fail("Invalid label", label);
        
        } else {
        
            // TODO: token may be mutated!
            if (!labelSet[""] && !(keyword === "break" && this.context.switchDepth > 0))
                this.fail("Invalid " + keyword + " statement", token);
        }
        
        return { 
            type: keyword === "break" ? "Break" : "Continue", 
            label: label,
            start: start,
            end: this.endOffset
        };
    },
    
    ThrowStatement: function() {
    
        var start = this.startOffset;
        
        this.read("throw");
        
        var expr = this.maybeEnd() ? this.Expression() : null;
        
        if (expr === null)
            this.fail("Missing throw expression");
        
        this.Semicolon();
        
        return { 
            type: "ThrowStatement", 
            expression: expr,
            start: start,
            end: this.endOffset
        };
    },
    
    DebuggerStatement: function() {
    
        var start = this.startOffset;
        
        this.read("debugger");
        this.Semicolon();
        
        return { 
            type: "DebuggerStatement",
            start: start,
            end: this.endOffset
        };
    },
    
    IfStatement: function() {
    
        var start = this.startOffset;
        
        this.read("if");
        this.read("(");
        
        var test = this.Expression(),
            body = null,
            elseBody = null;
        
        this.read(")");
        body = this.Statement();
        
        if (this.peek() === "else") {
        
            this.read();
            elseBody = this.Statement();
        }
        
        return { 
            type: "IfStatement", 
            test: test, 
            consequent: body, 
            alternate: elseBody,
            start: start,
            end: this.endOffset
        };
    },
    
    DoWhileStatement: function() {
    
        var start = this.startOffset,
            body, 
            test;
        
        this.read("do");
        body = this.StatementWithLabel();
        
        this.read("while");
        this.read("(");
        
        test = this.Expression();
        
        this.read(")");
        
        return { 
            type: "DoWhileStatement", 
            body: body, 
            test: test,
            start: start,
            end: this.endOffset
        };
    },
    
    WhileStatement: function() {
    
        var start = this.startOffset;
        
        this.read("while");
        this.read("(");
        
        return {
            type: "WhileStatement",
            test: this.Expression(),
            body: (this.read(")"), this.StatementWithLabel()),
            start: start,
            end: this.endOffset
        };
    },
    
    ForStatement: function() {
    
        var start = this.startOffset,
            init = null,
            test,
            step;
        
        this.read("for");
        this.read("(");
        
        // Get loop initializer
        switch (this.peek()) {
        
            case ";":
                break;
                
            case "var":
            case "let":
            case "const":
                init = this.VariableDeclaration(true);
                break;
            
            default:
                init = this.Expression(true);
                break;
        }
        
        if (init) {
        
            if (this.peekKeyword("in"))
                return this.ForInStatement(init, start);
        
            if (this.peekKeyword("of"))
                return this.ForOfStatement(init, start);
        }
        
        this.read(";");
        test = this.peek() === ";" ? null : this.Expression();
        
        this.read(";");
        step = this.peek() === ")" ? null : this.Expression();
        
        this.read(")");
        
        return {
            type: "ForStatement",
            init: init,
            test: test,
            update: step,
            body: this.StatementWithLabel(),
            start: start,
            end: this.endOffset
        };
    },
    
    ForInStatement: function(init, start) {
    
        this.checkForInit(init, "in");
        
        this.read("in");
        var expr = this.Expression();
        this.read(")");
        
        return {
            type: "ForInStatement",
            left: init,
            right: expr,
            body: this.StatementWithLabel(),
            start: start,
            end: this.endOffset
        };
    },
    
    ForOfStatement: function(init, start) {
    
        this.checkForInit(init, "of");
        
        this.readKeyword("of");
        var expr = this.Expression();
        this.read(")");
        
        return {
            type: "ForOfStatement",
            left: init,
            right: expr,
            body: this.StatementWithLabel(),
            start: start,
            end: this.endOffset
        };
    },
    
    WithStatement: function() {
    
        if (this.context.strict)
            this.fail("With statement is not allowed in strict mode");
    
        var start = this.startOffset;
        
        this.read("with");
        this.read("(");
        
        return {
            type: "WithStatement",
            object: this.Expression(),
            body: (this.read(")"), this.Statement()),
            start: start,
            end: this.endOffset
        };
    },
    
    SwitchStatement: function() {
    
        var start = this.startOffset;
        
        this.read("switch");
        this.read("(");
        
        var head = this.Expression(),
            hasDefault = false,
            cases = [],
            node;
        
        this.read(")");
        this.read("{");
        this.context.switchDepth += 1;
        
        while (this.peekUntil("}")) {
        
            node = this.Case();
            
            if (node.test === null) {
            
                if (hasDefault)
                    this.fail("Switch statement cannot have more than one default");
                
                hasDefault = true;
            }
            
            cases.push(node);
        }
        
        this.context.switchDepth -= 1;
        this.read("}");
        
        return {
            type: "SwitchStatement",
            descriminant: head,
            cases: cases,
            start: start,
            end: this.endOffset
        };
    },
    
    Case: function() {
    
        var start = this.startOffset,
            expr = null, 
            list = [],
            type;
        
        if (this.peek() === "default") {
        
            this.read();
        
        } else {
        
            this.read("case");
            expr = this.Expression();
        }
        
        this.read(":");
        
        while (type = this.peekUntil("}")) {
        
            if (type === "case" || type === "default")
                break;
            
            list.push(this.Statement());
        }
        
        return {
            type: "SwitchCase",
            test: expr,
            consequent: list,
            start: start,
            end: this.endOffset
        };
    },
    
    TryStatement: function() {
    
        var start = this.startOffset;
        
        this.read("try");
        
        var tryBlock = this.Block(),
            handler = null,
            fin = null;
        
        if (this.peek() === "catch")
            handler = this.Catch();
        
        if (this.peek() === "finally") {
        
            this.read("finally");
            fin = this.Block();
        }
        
        return {
            type: "TryStatement",
            block: tryBlock,
            handler: handler,
            finalizer: fin,
            start: start,
            end: this.endOffset
        };
    },
    
    Catch: function() {
    
        var start = this.startOffset;
        
        this.read("catch");
        this.read("(");
    
        var param = this.BindingPattern();
        
        this.read(")");
        
        return {
            type: "CatchClause",
            param: param,
            body: this.Block(),
            start: start,
            end: this.endOffset
        };
    },
    
    // === Declarations ===
    
    StatementList: function(prologue, isModule) {
    
        var list = [],
            element,
            node,
            dir;
        
        while (this.peekUntil("}")) {
        
            list.push(element = this.Declaration(isModule));
            
            // Check for directives
            if (prologue && 
                element.type === "ExpressionStatement" &&
                element.expression.type === "String") {
                
                // Get the non-escaped literal text of the string
                node = element.expression;
                dir = this.input.slice(node.start + 1, node.end - 1);
                
                element.directive = dir;
                
                // Check for strict mode
                if (dir === "use strict")
                    this.setStrict();
                    
            } else {
            
                prologue = false;
            }
        }
        
        // Check for invalid nodes
        this.checkInvalidNodes();
        
        return list;
    },
    
    Declaration: function(isModule) {
    
        switch (this.peek()) {
            
            case "function": return this.FunctionDeclaration();
            case "class": return this.ClassDeclaration();
            case "let": 
            case "const": return this.LexicalDeclaration();
            
            case "import": return this.ImportDeclaration();
            
            case "export":
                
                if (isModule)
                    return this.ExportDeclaration();
                
                break;
            
            case "IDENTIFIER":
                
                if (this.peekModule(true))
                    return this.ModuleDeclaration();
                
                break;
        }
        
        return this.Statement();
    },
    
    LexicalDeclaration: function() {
    
        var node = this.VariableDeclaration(false);
        
        this.Semicolon();
        node.end = this.endOffset;
        
        return node;
    },
    
    // === Functions ===
    
    FunctionDeclaration: function() {
    
        var start = this.startOffset,
            gen = false,
            ident,
            params;
        
        this.read("function");
        
        if (this.peek() === "*") {
            
            this.read();
            gen = true;
        }
        
        return { 
            type: "FunctionDeclaration", 
            generator: gen,
            ident: (ident = this.Identifier()),
            params: (params = this.FormalParameters()),
            body: this.FunctionBody(ident, params, false),
            start: start,
            end: this.endOffset
        };
    },
    
    FunctionExpression: function() {
    
        var start = this.startOffset,
            gen = false,
            ident = null,
            params;
        
        this.read("function");
        
        if (this.peek() === "*") {
            
            this.read();
            gen = true;
        }
        
        if (this.peek() !== "(")
            ident = this.Identifier();
        
        return { 
            type: "FunctionExpression", 
            generator: gen,
            ident: ident,
            params: (params = this.FormalParameters()),
            body: this.FunctionBody(ident, params, false),
            start: start,
            end: this.endOffset
        };
    },
    
    FormalParameters: function() {
    
        var list = [];
        
        this.read("(");
        
        while (this.peekUntil(")")) {
            
            if (list.length > 0)
                this.read(",");
            
            // Parameter list may have a trailing rest parameter
            if (this.peek() === "...") {
            
                list.push(this.RestParameter());
                break;
            }
            
            list.push(this.FormalParameter());
        }
        
        this.read(")");
        
        return list;
    },
    
    FormalParameter: function() {
    
        var start = this.startOffset,
            pattern = this.BindingPattern(),
            init = null;
        
        if (this.peek() === "=") {
        
            this.read("=");
            init = this.AssignmentExpression();
        }
        
        return { 
            type: "FormalParameter", 
            pattern: pattern, 
            init: init,
            start: start,
            end: this.endOffset
        };
    },
    
    RestParameter: function() {
    
        var start = this.startOffset;
        
        this.read("...");
        
        return { 
            type: "RestParameter", 
            ident: this.BindingIdentifier(),
            start: start,
            end: this.endOffset
        };
    },
    
    FunctionBody: function(ident, params, isStrict) {
    
        this.pushContext(true, isStrict);
        
        var start = this.startOffset;
        
        this.read("{");
        var statements = this.StatementList(true);
        this.read("}");
        
        if (ident) this.checkBindingIdent(ident);
        this.checkParameters(params);
        
        this.popContext();
        
        return {
            type: "FunctionBody",
            statements: statements,
            start: start,
            end: this.endOffset
        };
    },
    
    ArrowFunction: function(formals, rest, start) {
    
        this.read("=>");
        
        var params = this.transformFormals(formals), 
            body;
        
        if (rest)
            params.push(rest);
        
        if (this.peek() === "{") {
        
            body = this.FunctionBody(null, params, true);
            
        } else {
        
            // Check parameters in the current context
            this.checkParameters(params);
            body = this.AssignmentExpression();
        }
        
        return {
            type: "ArrowFunction",
            params: params,
            body: body,
            start: start,
            end: this.endOffset
        };
    },
    
    // === Modules ===
    
    ModuleDeclaration: function() {
        
        var start = this.startOffset;
        
        this.readKeyword("module");
        
        if (this.peek() === "STRING") {
        
            return {
                type: "ModuleRegistration",
                url: this.String(),
                body: this.ModuleBody(),
                start: start,
                end: this.endOffset
            };
        }
        
        var ident = this.BindingIdentifier(),
            spec;
        
        if (this.peek() === "=") {
        
            this.read();
            spec = this.peek() === "STRING" ? this.String() : this.BindingPath();
            this.Semicolon();
            
            return {
                type: "ModuleAlias",
                ident: ident,
                specifier: spec,
                start: start,
                end: this.endOffset
            };
        }
        
        return { 
            type: "ModuleDeclaration", 
            ident: ident, 
            body: this.ModuleBody(),
            start: start,
            end: this.endOffset
        };
    },
    
    ModuleBody: function() {
    
        this.pushContext(false, true);
        
        var start = this.startOffset;
        
        this.read("{");
        var list = this.StatementList(true, true);
        this.read("}");
        
        this.popContext();
        
        return {
            type: "ModuleBody", 
            statements: list,
            start: start,
            end: this.endOffset
        };
    },
    
    ImportDeclaration: function() {
    
        var start = this.startOffset,
            binding,
            from;
        
        this.read("import");
        
        binding = this.peek() === "{" ?
            this.ImportSpecifierSet() :
            this.BindingIdentifier();
        
        this.readKeyword("from");
        from = this.peek() === "STRING" ? this.String() : this.BindingPath();
        this.Semicolon();
        
        return { 
            type: "ImportDeclaration",
            binding: binding,
            from: from,
            start: start,
            end: this.endOffset
        };
    },
    
    ImportSpecifierSet: function() {
        
        var start = this.startOffset,
            list = [];
        
        this.read("{");
        
        while (true) {
        
            list.push(this.ImportSpecifier());
            
            if (this.peek("div") === ",") this.read();
            else break;
        }
        
        this.read("}");
        
        return { 
            type: "ImportSpecifierSet", 
            specifiers: list,
            start: start,
            end: this.endOffset
        };
    },
    
    ImportSpecifier: function() {
    
        var start = this.startOffset,
            name = this.Identifier(),
            ident = null;
        
        if (this.peek() === ":") {
        
            this.read();
            ident = this.BindingIdentifier();
            
        } else {
        
            this.checkBindingIdent(name);
        }
        
        return { 
            type: "ImportSpecifier", 
            name: name, 
            ident: ident,
            start: start,
            end: this.endOffset
        };
    },
    
    ExportDeclaration: function() {
    
        var start = this.startOffset,
            binding = null,
            from = null,
            maybeFrom = false;
        
        this.read("export");
        
        switch (this.peek()) {
                
            case "var":
            case "let":
            case "const":
            
                binding = this.VariableDeclaration(false);
                this.Semicolon();
                break;
            
            case "function":
            
                binding = this.FunctionDeclaration();
                break;
            
            case "class":
            
                binding = this.ClassDeclaration();
                break;
            
            case "IDENTIFIER":
            
                if (this.peekModule(false)) {
                
                    binding = this.ModuleDeclaration();
                
                } else {
                
                    binding = this.Identifier();
                    maybeFrom = true;
                }
                
                break;
            
            case "*":
            
                this.read();
                maybeFrom = true;
                break;
            
            default:
            
                binding = this.ExportSpecifierSet();
                maybeFrom = true;
                break;
        }
        
        if (maybeFrom) {
        
            if (this.peekKeyword("from")) {
            
                this.read();
                from = this.peek() === "STRING" ? this.String() : this.BindingPath();
            }
            
            this.Semicolon();
        }
        
        return { 
            type: "ExportDeclaration", 
            binding: binding,
            from: from,
            start: start,
            end: this.endOffset
        };
    },
    
    ExportSpecifierSet: function() {
    
        var start = this.startOffset,
            list = [];
        
        this.read("{");
        
        while (true) {
        
            list.push(this.ExportSpecifier());
            
            if (this.peek("div") === ",") this.read();
            else break;
        }
        
        this.read("}");
        
        return { 
            type: "ExportSpecifierSet", 
            specifiers: list,
            start: start,
            end: this.endOffset
        };
    },
    
    ExportSpecifier: function() {
    
        var start = this.startOffset,
            ident = this.Identifier(),
            path = null;
            
        if (this.peek() === ":") {
        
            this.checkBindingIdent(ident);
            
            this.read();
            path = this.BindingPath();
        }
        
        return { 
            type: "ExportSpecifier", 
            ident: ident, 
            path: path,
            start: start,
            end: this.endOffset
        };
    },
    
    BindingPath: function() {
    
        var start = this.startOffset,
            path = [];
        
        while (true) {
        
            path.push(this.readToken("IDENTIFIER").value);
            
            if (this.peek("div") === ".") this.read();
            else break;
        }
        
        return { 
            type: "BindingPath", 
            elements: path,
            start: start,
            end: this.endOffset
        };
    },
    
    // === Classes ===
    
    ClassDeclaration: function() {
    
        var start = this.startOffset;
        
        this.read("class");
        
        return this.ClassLiteral("ClassDeclaration", this.BindingIdentifier(), start);
    },
    
    ClassExpression: function() {
    
        var start = this.startOffset, 
            ident = null;
        
        this.read("class");
        
        if (this.peek() === "IDENTIFIER")
            ident = this.BindingIdentifier();
        
        return this.ClassLiteral("ClassExpression", ident, start);
    },
    
    ClassLiteral: function(type, ident, start) {
    
        var base = null;
        
        if (this.peek() === "extends") {
        
            this.read();
            base = this.AssignmentExpression();
        }
        
        return {
            type: type,
            ident: ident,
            base: base,
            body: this.ClassBody(),
            start: start,
            end: this.endOffset
        };
    },
    
    ClassBody: function() {
    
        this.pushContext(false, true);
        
        var start = this.startOffset,
            nameSet = {}, 
            list = [];
        
        this.read("{");
        
        while (this.peekUntil("}", "name"))
            list.push(this.ClassElement(nameSet));
        
        this.read("}");
        
        this.popContext();
        
        return {
            type: "ClassBody",
            elements: list,
            start: start,
            end: this.endOffset
        };
    },
    
    ClassElement: function(nameSet) {
    
        var node = this.MethodDefinition(),
            flag = PROP_NORMAL,
            name;
        
        switch (node.accessor) {
        
            case "get": flag = PROP_GET; break;
            case "set": flag = PROP_SET; break;
        }
        
        // Check for duplicate names
        if (this.isDuplicateName(flag, nameSet[name = "." + node.name.value]))
            this.fail("Duplicate element name in class definition.", node);
        
        // Set name flag
        nameSet[name] |= flag;
        
        return node;
    }
    
    
}});

// Add externally defined methods
mixin(Transform);
mixin(Validate);

exports.Parser = Parser;
};

__modules[20] = function(exports) {
// === Unicode Categories for Javascript ===
var Unicode = (function() {

    var cat = {
    
        Ll: "0061-007A00AA00B500BA00DF-00F600F8-00FF01010103010501070109010B010D010F01110113011501170119011B011D011F01210123012501270129012B012D012F01310133013501370138013A013C013E014001420144014601480149014B014D014F01510153015501570159015B015D015F01610163016501670169016B016D016F0171017301750177017A017C017E-0180018301850188018C018D019201950199-019B019E01A101A301A501A801AA01AB01AD01B001B401B601B901BA01BD-01BF01C601C901CC01CE01D001D201D401D601D801DA01DC01DD01DF01E101E301E501E701E901EB01ED01EF01F001F301F501F901FB01FD01FF02010203020502070209020B020D020F02110213021502170219021B021D021F02210223022502270229022B022D022F02310233-0239023C023F0240024202470249024B024D024F-02930295-02AF037103730377037B-037D039003AC-03CE03D003D103D5-03D703D903DB03DD03DF03E103E303E503E703E903EB03ED03EF-03F303F503F803FB03FC0430-045F04610463046504670469046B046D046F04710473047504770479047B047D047F0481048B048D048F04910493049504970499049B049D049F04A104A304A504A704A904AB04AD04AF04B104B304B504B704B904BB04BD04BF04C204C404C604C804CA04CC04CE04CF04D104D304D504D704D904DB04DD04DF04E104E304E504E704E904EB04ED04EF04F104F304F504F704F904FB04FD04FF05010503050505070509050B050D050F05110513051505170519051B051D051F0521052305250561-05871D00-1D2B1D62-1D771D79-1D9A1E011E031E051E071E091E0B1E0D1E0F1E111E131E151E171E191E1B1E1D1E1F1E211E231E251E271E291E2B1E2D1E2F1E311E331E351E371E391E3B1E3D1E3F1E411E431E451E471E491E4B1E4D1E4F1E511E531E551E571E591E5B1E5D1E5F1E611E631E651E671E691E6B1E6D1E6F1E711E731E751E771E791E7B1E7D1E7F1E811E831E851E871E891E8B1E8D1E8F1E911E931E95-1E9D1E9F1EA11EA31EA51EA71EA91EAB1EAD1EAF1EB11EB31EB51EB71EB91EBB1EBD1EBF1EC11EC31EC51EC71EC91ECB1ECD1ECF1ED11ED31ED51ED71ED91EDB1EDD1EDF1EE11EE31EE51EE71EE91EEB1EED1EEF1EF11EF31EF51EF71EF91EFB1EFD1EFF-1F071F10-1F151F20-1F271F30-1F371F40-1F451F50-1F571F60-1F671F70-1F7D1F80-1F871F90-1F971FA0-1FA71FB0-1FB41FB61FB71FBE1FC2-1FC41FC61FC71FD0-1FD31FD61FD71FE0-1FE71FF2-1FF41FF61FF7210A210E210F2113212F21342139213C213D2146-2149214E21842C30-2C5E2C612C652C662C682C6A2C6C2C712C732C742C76-2C7C2C812C832C852C872C892C8B2C8D2C8F2C912C932C952C972C992C9B2C9D2C9F2CA12CA32CA52CA72CA92CAB2CAD2CAF2CB12CB32CB52CB72CB92CBB2CBD2CBF2CC12CC32CC52CC72CC92CCB2CCD2CCF2CD12CD32CD52CD72CD92CDB2CDD2CDF2CE12CE32CE42CEC2CEE2D00-2D25A641A643A645A647A649A64BA64DA64FA651A653A655A657A659A65BA65DA65FA663A665A667A669A66BA66DA681A683A685A687A689A68BA68DA68FA691A693A695A697A723A725A727A729A72BA72DA72F-A731A733A735A737A739A73BA73DA73FA741A743A745A747A749A74BA74DA74FA751A753A755A757A759A75BA75DA75FA761A763A765A767A769A76BA76DA76FA771-A778A77AA77CA77FA781A783A785A787A78CFB00-FB06FB13-FB17FF41-FF5A",
        Lu: "0041-005A00C0-00D600D8-00DE01000102010401060108010A010C010E01100112011401160118011A011C011E01200122012401260128012A012C012E01300132013401360139013B013D013F0141014301450147014A014C014E01500152015401560158015A015C015E01600162016401660168016A016C016E017001720174017601780179017B017D018101820184018601870189-018B018E-0191019301940196-0198019C019D019F01A001A201A401A601A701A901AC01AE01AF01B1-01B301B501B701B801BC01C401C701CA01CD01CF01D101D301D501D701D901DB01DE01E001E201E401E601E801EA01EC01EE01F101F401F6-01F801FA01FC01FE02000202020402060208020A020C020E02100212021402160218021A021C021E02200222022402260228022A022C022E02300232023A023B023D023E02410243-02460248024A024C024E03700372037603860388-038A038C038E038F0391-03A103A3-03AB03CF03D2-03D403D803DA03DC03DE03E003E203E403E603E803EA03EC03EE03F403F703F903FA03FD-042F04600462046404660468046A046C046E04700472047404760478047A047C047E0480048A048C048E04900492049404960498049A049C049E04A004A204A404A604A804AA04AC04AE04B004B204B404B604B804BA04BC04BE04C004C104C304C504C704C904CB04CD04D004D204D404D604D804DA04DC04DE04E004E204E404E604E804EA04EC04EE04F004F204F404F604F804FA04FC04FE05000502050405060508050A050C050E05100512051405160518051A051C051E0520052205240531-055610A0-10C51E001E021E041E061E081E0A1E0C1E0E1E101E121E141E161E181E1A1E1C1E1E1E201E221E241E261E281E2A1E2C1E2E1E301E321E341E361E381E3A1E3C1E3E1E401E421E441E461E481E4A1E4C1E4E1E501E521E541E561E581E5A1E5C1E5E1E601E621E641E661E681E6A1E6C1E6E1E701E721E741E761E781E7A1E7C1E7E1E801E821E841E861E881E8A1E8C1E8E1E901E921E941E9E1EA01EA21EA41EA61EA81EAA1EAC1EAE1EB01EB21EB41EB61EB81EBA1EBC1EBE1EC01EC21EC41EC61EC81ECA1ECC1ECE1ED01ED21ED41ED61ED81EDA1EDC1EDE1EE01EE21EE41EE61EE81EEA1EEC1EEE1EF01EF21EF41EF61EF81EFA1EFC1EFE1F08-1F0F1F18-1F1D1F28-1F2F1F38-1F3F1F48-1F4D1F591F5B1F5D1F5F1F68-1F6F1FB8-1FBB1FC8-1FCB1FD8-1FDB1FE8-1FEC1FF8-1FFB21022107210B-210D2110-211221152119-211D212421262128212A-212D2130-2133213E213F214521832C00-2C2E2C602C62-2C642C672C692C6B2C6D-2C702C722C752C7E-2C802C822C842C862C882C8A2C8C2C8E2C902C922C942C962C982C9A2C9C2C9E2CA02CA22CA42CA62CA82CAA2CAC2CAE2CB02CB22CB42CB62CB82CBA2CBC2CBE2CC02CC22CC42CC62CC82CCA2CCC2CCE2CD02CD22CD42CD62CD82CDA2CDC2CDE2CE02CE22CEB2CEDA640A642A644A646A648A64AA64CA64EA650A652A654A656A658A65AA65CA65EA662A664A666A668A66AA66CA680A682A684A686A688A68AA68CA68EA690A692A694A696A722A724A726A728A72AA72CA72EA732A734A736A738A73AA73CA73EA740A742A744A746A748A74AA74CA74EA750A752A754A756A758A75AA75CA75EA760A762A764A766A768A76AA76CA76EA779A77BA77DA77EA780A782A784A786A78BFF21-FF3A",
        Lt: "01C501C801CB01F21F88-1F8F1F98-1F9F1FA8-1FAF1FBC1FCC1FFC",
        Lm: "02B0-02C102C6-02D102E0-02E402EC02EE0374037A0559064006E506E607F407F507FA081A0824082809710E460EC610FC17D718431AA71C78-1C7D1D2C-1D611D781D9B-1DBF2071207F2090-20942C7D2D6F2E2F30053031-3035303B309D309E30FC-30FEA015A4F8-A4FDA60CA67FA717-A71FA770A788A9CFAA70AADDFF70FF9EFF9F",
        Lo: "01BB01C0-01C3029405D0-05EA05F0-05F20621-063F0641-064A066E066F0671-06D306D506EE06EF06FA-06FC06FF07100712-072F074D-07A507B107CA-07EA0800-08150904-0939093D09500958-096109720979-097F0985-098C098F09900993-09A809AA-09B009B209B6-09B909BD09CE09DC09DD09DF-09E109F009F10A05-0A0A0A0F0A100A13-0A280A2A-0A300A320A330A350A360A380A390A59-0A5C0A5E0A72-0A740A85-0A8D0A8F-0A910A93-0AA80AAA-0AB00AB20AB30AB5-0AB90ABD0AD00AE00AE10B05-0B0C0B0F0B100B13-0B280B2A-0B300B320B330B35-0B390B3D0B5C0B5D0B5F-0B610B710B830B85-0B8A0B8E-0B900B92-0B950B990B9A0B9C0B9E0B9F0BA30BA40BA8-0BAA0BAE-0BB90BD00C05-0C0C0C0E-0C100C12-0C280C2A-0C330C35-0C390C3D0C580C590C600C610C85-0C8C0C8E-0C900C92-0CA80CAA-0CB30CB5-0CB90CBD0CDE0CE00CE10D05-0D0C0D0E-0D100D12-0D280D2A-0D390D3D0D600D610D7A-0D7F0D85-0D960D9A-0DB10DB3-0DBB0DBD0DC0-0DC60E01-0E300E320E330E40-0E450E810E820E840E870E880E8A0E8D0E94-0E970E99-0E9F0EA1-0EA30EA50EA70EAA0EAB0EAD-0EB00EB20EB30EBD0EC0-0EC40EDC0EDD0F000F40-0F470F49-0F6C0F88-0F8B1000-102A103F1050-1055105A-105D106110651066106E-10701075-1081108E10D0-10FA1100-1248124A-124D1250-12561258125A-125D1260-1288128A-128D1290-12B012B2-12B512B8-12BE12C012C2-12C512C8-12D612D8-13101312-13151318-135A1380-138F13A0-13F41401-166C166F-167F1681-169A16A0-16EA1700-170C170E-17111720-17311740-17511760-176C176E-17701780-17B317DC1820-18421844-18771880-18A818AA18B0-18F51900-191C1950-196D1970-19741980-19AB19C1-19C71A00-1A161A20-1A541B05-1B331B45-1B4B1B83-1BA01BAE1BAF1C00-1C231C4D-1C4F1C5A-1C771CE9-1CEC1CEE-1CF12135-21382D30-2D652D80-2D962DA0-2DA62DA8-2DAE2DB0-2DB62DB8-2DBE2DC0-2DC62DC8-2DCE2DD0-2DD62DD8-2DDE3006303C3041-3096309F30A1-30FA30FF3105-312D3131-318E31A0-31B731F0-31FF3400-4DB54E00-9FCBA000-A014A016-A48CA4D0-A4F7A500-A60BA610-A61FA62AA62BA66EA6A0-A6E5A7FB-A801A803-A805A807-A80AA80C-A822A840-A873A882-A8B3A8F2-A8F7A8FBA90A-A925A930-A946A960-A97CA984-A9B2AA00-AA28AA40-AA42AA44-AA4BAA60-AA6FAA71-AA76AA7AAA80-AAAFAAB1AAB5AAB6AAB9-AABDAAC0AAC2AADBAADCABC0-ABE2AC00-D7A3D7B0-D7C6D7CB-D7FBF900-FA2DFA30-FA6DFA70-FAD9FB1DFB1F-FB28FB2A-FB36FB38-FB3CFB3EFB40FB41FB43FB44FB46-FBB1FBD3-FD3DFD50-FD8FFD92-FDC7FDF0-FDFBFE70-FE74FE76-FEFCFF66-FF6FFF71-FF9DFFA0-FFBEFFC2-FFC7FFCA-FFCFFFD2-FFD7FFDA-FFDC",
        Mn: "0300-036F0483-04870591-05BD05BF05C105C205C405C505C70610-061A064B-065E067006D6-06DC06DF-06E406E706E806EA-06ED07110730-074A07A6-07B007EB-07F30816-0819081B-08230825-08270829-082D0900-0902093C0941-0948094D0951-095509620963098109BC09C1-09C409CD09E209E30A010A020A3C0A410A420A470A480A4B-0A4D0A510A700A710A750A810A820ABC0AC1-0AC50AC70AC80ACD0AE20AE30B010B3C0B3F0B41-0B440B4D0B560B620B630B820BC00BCD0C3E-0C400C46-0C480C4A-0C4D0C550C560C620C630CBC0CBF0CC60CCC0CCD0CE20CE30D41-0D440D4D0D620D630DCA0DD2-0DD40DD60E310E34-0E3A0E47-0E4E0EB10EB4-0EB90EBB0EBC0EC8-0ECD0F180F190F350F370F390F71-0F7E0F80-0F840F860F870F90-0F970F99-0FBC0FC6102D-10301032-10371039103A103D103E10581059105E-10601071-1074108210851086108D109D135F1712-17141732-1734175217531772177317B7-17BD17C617C9-17D317DD180B-180D18A91920-19221927192819321939-193B1A171A181A561A58-1A5E1A601A621A65-1A6C1A73-1A7C1A7F1B00-1B031B341B36-1B3A1B3C1B421B6B-1B731B801B811BA2-1BA51BA81BA91C2C-1C331C361C371CD0-1CD21CD4-1CE01CE2-1CE81CED1DC0-1DE61DFD-1DFF20D0-20DC20E120E5-20F02CEF-2CF12DE0-2DFF302A-302F3099309AA66FA67CA67DA6F0A6F1A802A806A80BA825A826A8C4A8E0-A8F1A926-A92DA947-A951A980-A982A9B3A9B6-A9B9A9BCAA29-AA2EAA31AA32AA35AA36AA43AA4CAAB0AAB2-AAB4AAB7AAB8AABEAABFAAC1ABE5ABE8ABEDFB1EFE00-FE0FFE20-FE26",
        Mc: "0903093E-09400949-094C094E0982098309BE-09C009C709C809CB09CC09D70A030A3E-0A400A830ABE-0AC00AC90ACB0ACC0B020B030B3E0B400B470B480B4B0B4C0B570BBE0BBF0BC10BC20BC6-0BC80BCA-0BCC0BD70C01-0C030C41-0C440C820C830CBE0CC0-0CC40CC70CC80CCA0CCB0CD50CD60D020D030D3E-0D400D46-0D480D4A-0D4C0D570D820D830DCF-0DD10DD8-0DDF0DF20DF30F3E0F3F0F7F102B102C10311038103B103C105610571062-10641067-106D108310841087-108C108F109A-109C17B617BE-17C517C717C81923-19261929-192B193019311933-193819B0-19C019C819C91A19-1A1B1A551A571A611A631A641A6D-1A721B041B351B3B1B3D-1B411B431B441B821BA11BA61BA71BAA1C24-1C2B1C341C351CE11CF2A823A824A827A880A881A8B4-A8C3A952A953A983A9B4A9B5A9BAA9BBA9BD-A9C0AA2FAA30AA33AA34AA4DAA7BABE3ABE4ABE6ABE7ABE9ABEAABEC",
        Nd: "0030-00390660-066906F0-06F907C0-07C90966-096F09E6-09EF0A66-0A6F0AE6-0AEF0B66-0B6F0BE6-0BEF0C66-0C6F0CE6-0CEF0D66-0D6F0E50-0E590ED0-0ED90F20-0F291040-10491090-109917E0-17E91810-18191946-194F19D0-19DA1A80-1A891A90-1A991B50-1B591BB0-1BB91C40-1C491C50-1C59A620-A629A8D0-A8D9A900-A909A9D0-A9D9AA50-AA59ABF0-ABF9FF10-FF19",
        Nl: "16EE-16F02160-21822185-218830073021-30293038-303AA6E6-A6EF",
        Pc: "005F203F20402054FE33FE34FE4D-FE4FFF3F"
    
    };
    
    var pattern = /([0-9a-f]{4})(-[0-9a-f]{4})?/ig;
    
    Object.keys(cat).forEach((function(k) {
    
        cat[k] = cat[k].replace(pattern, (function(m, m1, m2) { return "\\u" + m1 + (m2 ? "-\\u" + m2.slice(1) : ""); })
        );
    }));
    
    return cat;

})();

// === Unicode Matching Patterns ===
var unicodeLetter = Unicode.Lu + Unicode.Ll + Unicode.Lt + Unicode.Lm + Unicode.Lo + Unicode.Nl,
    identifierStart = new RegExp("^[\\\\_$" + unicodeLetter + "]"),
    identifierPart = new RegExp("^[_$\u200c\u200d" + unicodeLetter + Unicode.Mn + Unicode.Mc + Unicode.Nd + Unicode.Pc + "]+"),
    identifierEscape = /\\u([0-9a-fA-F]{4})/g,
    whitespaceChars = /\t\v\f\uFEFF \u1680\u180E\u202F\u205F\u3000\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A/,
    newlineSequence = /\r\n?|[\n\u2028\u2029]/g;


// === Reserved Words ===
var reservedWord = new RegExp("^(?:" +
    "break|case|catch|class|const|continue|debugger|default|delete|do|" +
    "else|enum|export|extends|false|finally|for|function|if|import|in|" +
    "instanceof|new|null|return|super|switch|this|throw|true|try|typeof|" +
    "var|void|while|with" +
")$");

var strictReservedWord = new RegExp("^(?:" +
    "implements|private|public|interface|package|let|protected|static|yield" +
")$");

// === Punctuators ===
var multiCharPunctuator = new RegExp("^(?:" +
    "[-+]{2}|" +
    "[&|]{2}|" +
    "<<=?|" +
    ">>>?=?|" +
    "[!=]==|" +
    "=>|" +
    "[\.]{2,3}|" +
    "[-+&|<>!=*&\^%\/]=" +
")$");

// === Miscellaneous Patterns ===
var octalEscape = /^(?:[0-3][0-7]{0,2}|[4-7][0-7]?)/,
      blockCommentPattern = /\r\n?|[\n\u2028\u2029]|\*\//g,
      hexChar = /[0-9a-f]/i;

// === Character Types ===
var WHITESPACE = 1,
    NEWLINE = 2,
    DECIMAL_DIGIT = 3,
    PUNCTUATOR = 4,
    STRING = 5,
    TEMPLATE = 6,
    IDENTIFIER = 7,
    ZERO = 8,
    DOT = 9,
    SLASH = 10,
    LBRACE = 11;

// === Character Type Lookup Table ===
var charTable = (function() {

    var table = new Array(128), i;
    
    add(WHITESPACE, "\t\v\f ");
    add(NEWLINE, "\r\n");
    add(DECIMAL_DIGIT, "123456789");
    add(PUNCTUATOR, "{[]();,<>+-*%&|^!~?:=");
    add(DOT, ".");
    add(SLASH, "/");
    add(LBRACE, "}");
    add(ZERO, "0");
    add(STRING, "'\"");
    add(TEMPLATE, "`");
    
    add(IDENTIFIER, "$_\\");
    for (i = 65; i <= 90; ++i) table[i] = IDENTIFIER;
    for (i = 97; i <= 122; ++i) table[i] = IDENTIFIER;
    
    return table;
    
    function add(type, string) {
    
        string.split("").forEach((function(c) { table[c.charCodeAt(0)] = type }));
    }

})();

// Performs a binary search on an array
function binarySearch(array, val) {

    var right = array.length - 1,
        left = 0,
        mid,
        test;
    
    while (left <= right) {
        
        mid = (left + right) >> 1;
        test = array[mid];
        
        if (val > test) left = mid + 1;
        else if (val < test) right = mid - 1;
        else return mid;
    }
    
    return left;
}

// Returns true if the character is a valid identifier part
function isIdentifierPart(c) {

    if (!c)
        return false;
    
    var code = c.charCodeAt(0);
    
    return  code > 64 && code < 91 || 
            code > 96 && code < 123 ||
            code > 47 && code < 58 ||
            code === 36 ||
            code === 95 ||
            code === 92 ||
            code > 123 && identifierPart.test(c);
}

// Returns true if the specified character is a newline
function isNewlineChar(c) {

    switch (c) {
    
        case "\r":
        case "\n":
        case "\u2028":
        case "\u2029":
            return true;
    }
    
    return false;
}

// Returns true if the specified character can exist in a non-starting position
function isPunctuatorNext(c) {

    switch (c) {
    
        case "+":
        case "-":
        case "&":
        case "|":
        case "<":
        case ">":
        case "=":
        case ".":
            return true;
    }
    
    return false;
}

// Returns true if the specified character is a valid numeric following character
function isNumberFollow(c) {

    if (!c)
        return true;
    
    var code = c.charCodeAt(0);
    
    return !(
        code > 64 && code < 91 || 
        code > 96 && code < 123 ||
        code > 47 && code < 58 ||
        code === 36 ||
        code === 95 ||
        code === 92 ||
        code > 123 && identifierStart.test(c)
    );
}

var Scanner = es6now.Class(null, function(__super) { return {

    constructor: function(input, offset) {

        this.input = input;
        this.offset = offset || 0;
        this.length = input.length;
        this.lines = [-1];
        
        this.strict = false;
        
        this.type = "";
        this.start = 0;
        this.end = 0;
        this.value = null;
        this.templateEnd = false;
        this.regexFlags = null;
        this.newlineBefore = false;
        this.error = "";
    },

    next: function(context) {

        if (this.type !== "COMMENT")
            this.newlineBefore = false;
        
        this.error = "";
        
        var type = null, 
            start;
        
        while (type === null) {
        
            start = this.offset;
            type = start >= this.length ? "EOF" : this.Start(context);
        }
        
        this.type = type;
        this.start = start;
        this.end = this.offset;
        
        return type;
    },
    
    raw: function(token) {
    
        token || (token = this);
        return this.input.slice(this.start, this.end);
    },
    
    position: function(token) {
    
        token || (token = this);
        
        var offset = token.start,
            i = binarySearch(this.lines, offset);
        
        return { 
        
            offset: offset, 
            line: i, 
            column: offset - this.lines[i - 1]
        };
    },
    
    addLineBreak: function(offset) {
    
        this.lines.push(offset);
    },
    
    readOctalEscape: function() {
    
        var m = octalEscape.exec(this.input.slice(this.offset, this.offset + 3)),
            val = m ? m[0] : "";
        
        this.offset += val.length;
        
        return val;
    },
    
    readStringEscape: function() {
    
        this.offset++;
        
        var chr, esc;
        
        switch (chr = this.input[this.offset++]) {
        
            case "t": return "\t";
            case "b": return "\b";
            case "v": return "\v";
            case "f": return "\f";
            case "r": return "\r";
            case "n": return "\n";
    
            case "\r":
            
                this.addLineBreak(this.offset - 1);
                
                if (this.input[this.offset] === "\n")
                    this.offset++;
                
                return "";
            
            case "\n":
            case "\u2028":
            case "\u2029":
            
                this.addLineBreak(this.offset - 1);
                return "";

            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            
                this.offset--;
                esc = this.readOctalEscape();
                
                if (esc === "0") {
                
                    return String.fromCharCode(0);
                
                } else if (this.strict) {
                
                    this.error = "Octal literals are not allowed in strict mode";
                    return null;
                    
                } else {
                
                    return String.fromCharCode(parseInt(esc, 8));
                }
            
            case "x":
            
                esc = this.readHex(2);
                return (esc.length < 2) ? null : String.fromCharCode(parseInt(esc, 16));
            
            case "u":
            
                esc = this.readHex(4);
                return (esc.length < 4) ? null : String.fromCharCode(parseInt(esc, 16));
            
            default: 
            
                return chr;
        }
    },
    
    readRange: function(low, high) {
    
        var start = this.offset,
            code;
        
        while (code = this.input.charCodeAt(this.offset)) {
        
            if (code >= low && code <= high) this.offset++;
            else break;
        }
        
        return this.input.slice(start, this.offset);
    },
    
    readInteger: function() {
    
        var start = this.offset,
            code;
        
        while (code = this.input.charCodeAt(this.offset)) {
        
            if (code >= 48 && code <= 57) this.offset++;
            else break;
        }
        
        return this.input.slice(start, this.offset);
    },
    
    readHex: function(maxLen) {
        
        var str = "", 
            chr;
        
        while (chr = this.input[this.offset]) {
        
            if (!hexChar.test(chr))
                break;
            
            str += chr;
            this.offset++;
            
            if (str.length === maxLen)
                break;
        }
        
        return str;
    },
    
    Start: function(context) {
    
        var code = this.input.charCodeAt(this.offset),
            next;
            
        switch (charTable[code]) {
        
            case WHITESPACE: return this.Whitespace();

            case NEWLINE: return this.Newline();
            
            case IDENTIFIER: return this.Identifier(context);
            
            case PUNCTUATOR: return this.Punctuator();
            
            case DECIMAL_DIGIT: return this.Number();
            
            case TEMPLATE: return this.Template();
            
            case STRING: return this.String();
            
            case ZERO: 
            
                switch (code = this.input.charCodeAt(this.offset + 1)) {
                
                    case 88: case 120: return this.HexNumber();   // x
                    case 66: case 98: return this.BinaryNumber(); // b
                    case 79: case 111: return this.OctalNumber(); // o
                }
                
                return code >= 48 && code <= 55 ?
                    this.LegacyOctalNumber() :
                    this.Number();
            
            case DOT: 
            
                code = this.input.charCodeAt(this.offset + 1);
                
                if (code >= 48 && code <= 57) return this.Number();
                else return this.Punctuator();
            
            case SLASH:
            
                next = this.input[this.offset + 1];

                if (next === "/") return this.LineComment();
                else if (next === "*") return this.BlockComment();
                else if (context === "div") return this.Punctuator();
                else return this.RegularExpression();
            
            case LBRACE:
            
                if (context === "template") return this.Template();
                else return this.Punctuator();
        }
        
        var chr = this.input[this.offset];
        
        // Unicode newlines
        if (isNewlineChar(chr))
            return this.Newline();
        
        // Unicode whitespace
        if (whitespaceChars.test(chr))
            return this.UnicodeWhitespace();
        
        // Unicode identifier chars
        if (identifierStart.test(chr))
            return this.Identifier(context);
        
        return this.Error();
    },
    
    Whitespace: function() {
    
        this.offset++;
        
        while (charTable[this.input.charCodeAt(this.offset)] === WHITESPACE)
            this.offset++;
        
        return null;
    },
    
    UnicodeWhitespace: function() {
    
        this.offset++;
        
        while (whitespaceChars.test(this.input[this.offset]))
            this.offset++;
        
        return null;
    },
    
    Newline: function() {
        
        this.addLineBreak(this.offset);
        
        if (this.input[this.offset++] === "\r" && this.input[this.offset] === "\n")
            this.offset++;
        
        this.newlineBefore = true;
        
        return null;
    },
    
    Punctuator: function(code) {
        
        var op = this.input[this.offset++], 
            chr,
            next;
        
        while (
            isPunctuatorNext(chr = this.input[this.offset]) &&
            multiCharPunctuator.test(next = op + chr)) {
        
            this.offset++;
            op = next;
        }
        
        return op;
    },
    
    Template: function() {
    
        var first = this.input[this.offset++],
            end = false, 
            val = "", 
            esc,
            chr;
        
        while (chr = this.input[this.offset]) {
            
            if (chr === "`") {
            
                end = true;
                break;
            }
            
            if (chr === "$" && this.input[this.offset + 1] === "{") {
            
                this.offset++;
                break;
            }
            
            if (chr === "\\") {
            
                esc = this.readStringEscape();
                
                if (!esc) 
                    return this.Error();
                
                val += esc;
                
            } else {
            
                val += chr;
                this.offset++;
            }
        }
        
        if (!chr)
            return this.Error();
        
        this.offset++;
        
        this.value = val;
        this.templateEnd = end;
        
        return "TEMPLATE";
    },
    
    String: function() {
    
        var delim = this.input[this.offset++],
            val = "",
            esc,
            chr;
        
        while (chr = this.input[this.offset]) {
        
            if (chr === delim)
                break;
            
            if (isNewlineChar(chr))
                return this.Error();
            
            if (chr === "\\") {
            
                esc = this.readStringEscape();
                
                if (esc === null)
                    return this.Error();
                
                val += esc;
                
            } else {
            
                val += chr;
                this.offset++;
            }
        }
        
        if (!chr)
            return this.Error();
        
        this.offset++;
        this.value = val;
        
        return "STRING";
    },
    
    RegularExpression: function() {
    
        this.offset++;
        
        var backslash = false, 
            inClass = false,
            flags = null,
            val = "", 
            chr;
        
        while ((chr = this.input[this.offset++])) {
        
            if (isNewlineChar(chr))
                return this.Error();
            
            if (backslash) {
            
                val += "\\" + chr;
                backslash = false;
            
            } else if (chr == "[") {
            
                inClass = true;
                val += chr;
            
            } else if (chr == "]" && inClass) {
            
                inClass = false;
                val += chr;
            
            } else if (chr == "/" && !inClass) {
            
                break;
            
            } else if (chr == "\\") {
            
                backslash = true;
                
            } else {
            
                val += chr;
            }
        }
        
        if (!chr)
            return this.Error();
        
        if (isIdentifierPart(this.input[this.offset]))
            flags = this.Identifier("name").value;
        
        this.value = val;
        this.regexFlags = flags;
        
        return "REGEX";
    },
    
    LegacyOctalNumber: function() {
    
        this.offset++;
        
        var start = this.offset,
            code;
        
        while (code = this.input.charCodeAt(this.offset)) {
        
            if (code >= 48 && code <= 55)
                this.offset++;
            else
                break;
        }
        
        if (this.strict)
            return this.Error("Octal literals are not allowed in strict mode");
        
        this.value = parseInt(this.input.slice(start, this.offset), 8);
        
        return isNumberFollow(this.input[this.offset]) ? "NUMBER" : this.Error();
    },
    
    Number: function() {
    
        var start = this.offset,
            next;
        
        this.readInteger();
        
        if (this.input[this.offset] === ".") {
        
            this.offset++;
            this.readInteger();
        }
        
        next = this.input[this.offset];
        
        if (next === "e" || next === "E") {
        
            this.offset++;
            
            next = this.input[this.offset];
            
            if (next === "+" || next === "-")
                this.offset++;
            
            if (!this.readInteger())
                return this.Error();
        }
        
        this.value = parseFloat(this.input.slice(start, this.offset));
        
        return isNumberFollow(this.input[this.offset]) ? "NUMBER" : this.Error();
    },
    
    BinaryNumber: function() {
    
        this.offset += 2;
        this.value = parseInt(this.readRange(48, 49), 2);
        
        return isNumberFollow(this.input[this.offset]) ? "NUMBER" : this.Error();
    },
    
    OctalNumber: function() {
    
        this.offset += 2;
        this.value = parseInt(this.readRange(48, 55), 8);
        
        return isNumberFollow(this.input[this.offset]) ? "NUMBER" : this.Error();
    },
    
    HexNumber: function() {
    
        this.offset += 2;
        this.value = parseInt(this.readHex(0), 16);
        
        return isNumberFollow(this.input[this.offset]) ? "NUMBER" : this.Error();
    },
    
    Identifier: function(context) {
    
        var start = this.offset,
            id = "",
            chr,
            hex;

        while (isIdentifierPart(chr = this.input[this.offset])) {
        
            if (chr === "\\") {
            
                id += this.input.slice(start, this.offset++);
                
                if (this.input[this.offset++] !== "u")
                    return this.Error();
                
                hex = this.readHex(4);
                
                if (hex.length < 4)
                    return this.Error();
                
                id += String.fromCharCode(parseInt(hex, 16));
                start = this.offset;
                
            } else {
            
                this.offset++;
            }
        }
        
        id += this.input.slice(start, this.offset);
        
        if (context !== "name")
            if (reservedWord.test(id) || this.strict && strictReservedWord.test(id))
                return id;
        
        this.value = id;
        
        return "IDENTIFIER";
    },
    
    LineComment: function() {
    
        this.offset += 2;
        
        var start = this.offset,
            chr;
        
        while (chr = this.input[this.offset]) {
        
            if (isNewlineChar(chr))
                break;
            
            this.offset++;
        }
        
        this.value = this.input.slice(start, this.offset);
        
        return "COMMENT";
    },
    
    BlockComment: function() {
    
        this.offset += 2;
        
        var pattern = blockCommentPattern,
            start = this.offset,
            m;
        
        while (true) {
        
            pattern.lastIndex = this.offset;
            
            m = pattern.exec(this.input);
            if (!m) return this.Error();
            
            this.offset = m.index + m[0].length;
            
            if (m[0] === "*/")
                break;
            
            this.newlineBefore = true;
            this.addLineBreak(m.index);
        }
        
        this.value = this.input.slice(start, this.offset - 2);
        
        return "COMMENT";
    },
    
    Error: function(msg) {
    
        this.offset++;
        
        if (msg)
            this.error = msg;
        
        return "ILLEGAL";
    }
    
}});

exports.Scanner = Scanner;
};

__modules[21] = function(exports) {
var Transform = es6now.Class(null, function(__super) { return {

    // Transform an expression into a formal parameter list
    transformFormals: function(expr) {
    
        if (expr === null)
            return [];
            
        var list = (expr.type === "SequenceExpression") ? expr.expressions : [expr],
            params = [],
            param,
            node,
            i;
    
        for (i = 0; i < list.length; ++i) {
        
            node = list[i];
            
            params.push(param = {
            
                type: "FormalParameter",
                pattern: node,
                init: null,
                start: node.start,
                end: node.end
            });
            
            this.transformPatternElement(param, true);
        }
        
        return params;
    },
    
    transformArrayPattern: function(node, binding) {
    
        node.type = "ArrayPattern";
        
        var elems = node.elements,
            elem,
            rest,
            i;
        
        for (i = 0; i < elems.length; ++i) {
        
            elem = elems[i];
            
            if (!elem) 
                continue;
            
            if (elem.type !== "PatternElement") {
            
                rest = (elem.type === "SpreadExpression");
                
                elem = elems[i] = {
                
                    type: "PatternElement",
                    pattern: rest ? elem.expression : elem,
                    init: null,
                    rest: rest,
                    start: elem.start,
                    end: elem.end
                };
                
                // No trailing comma allowed after rest
                if (rest && (node.trailingComma || i < elems.length - 1))
                    this.fail("Invalid destructuring pattern", elem);
            }
            
            if (elem.rest) this.transformPattern(elem.pattern, binding);
            else this.transformPatternElement(elem, binding);
        }
    },
    
    transformObjectPattern: function(node, binding) {

        node.type = "ObjectPattern";
        
        var props = node.properties, 
            prop,
            i;
        
        for (i = 0; i < props.length; ++i) {
        
            prop = props[i];
            
            switch (prop.type) {
            
                case "PatternProperty":
                
                    break;
                
                case "CoveredPatternProperty":
                    
                    prop.type = "PatternProperty";
                    break;
                    
                case "PropertyDefinition":
                    
                    prop.type = "PatternProperty";
                    prop.pattern = prop.expression;
                    prop.init = null;
                    
                    delete prop.expression;
                    break;
                
                default:
                
                    this.fail("Invalid pattern", prop);
            }
            
            // Clear error flags
            if (prop.error)
                delete prop.error;
            
            if (prop.pattern) this.transformPatternElement(prop, binding);
            else this.transformPattern(prop.name, binding);
        }
    },
    
    transformPatternElement: function(elem, binding) {
    
        var node = elem.pattern;
        
        // Split assignment into pattern and initializer
        if (node.type === "AssignmentExpression" && node.operator === "=") {
        
            elem.pattern = node.left;
            elem.init = node.right;
        }
        
        this.transformPattern(elem.pattern, binding);
    },
    
    // Transforms an expression into a pattern
    transformPattern: function(node, binding) {

        switch (node.type) {
        
            case "Identifier":
            
                if (binding) this.checkBindingIdent(node, true);
                else this.checkAssignTarget(node, true);
                
                break;
            
            case "MemberExpression":
            case "CallExpression":
                if (binding) this.fail("Invalid left-hand-side in binding pattern", node);
                break;
            
            case "ObjectExpression":
            case "ObjectPattern":
                this.transformObjectPattern(node, binding);
                break;
            
            case "ArrayExpression":
            case "ArrayPattern":
                this.transformArrayPattern(node, binding);
                break;
                
            default:
                this.fail("Invalid expression in pattern", node);
                break;
        }
        
        return node;
    }
    
}});


exports.Transform = Transform;
};

__modules[22] = function(exports) {
// Object literal property name flags
var PROP_NORMAL = 1,
    PROP_ASSIGN = 2,
    PROP_GET = 4,
    PROP_SET = 8;

// Returns true if the specified name is a restricted identifier in strict mode
function isPoisonIdent(name) {

    return name === "eval" || name === "arguments";
}

var Validate = es6now.Class(null, function(__super) { return {

    // Checks an assignment target for strict mode restrictions
    checkAssignTarget: function(node, strict) {
    
        if (node.type !== "Identifier")
            return;
        
        // Mark identifier node as a variable
        node.context = "variable";
        
        if (!strict && !this.context.strict)
            return;
        
        if (isPoisonIdent(node.value))
            this.fail("Cannot modify " + node.value + " in strict mode", node);
    },
    
    // Checks a binding identifier for strict mode restrictions
    checkBindingIdent: function(node, strict) {
    
        // Mark identifier node as a declaration
        node.context = "declaration";
        
        if (!strict && !this.context.strict)
            return;
            
        var name = node.value;
        
        if (isPoisonIdent(name))
            this.fail("Binding cannot be created for '" + name + "' in strict mode", node);
    },
    
    // Checks function formal parameters for strict mode restrictions
    checkParameters: function(params) {
    
        if (!this.context.strict)
            return;
        
        var names = {}, 
            name,
            node,
            i;
        
        for (i = 0; i < params.length; ++i) {
        
            node = params[i];
            
            if (node.type !== "FormalParameter" || node.pattern.type !== "Identifier")
                continue;
            
            name = node.pattern.value;
            
            if (isPoisonIdent(name))
                this.fail("Parameter name " + name + " is not allowed in strict mode", node);
            
            if (names[name] === 1)
                this.fail("Strict mode function may not have duplicate parameter names", node);
            
            names[name] = 1;
        }
    },
    
    // Performs validation on the init portion of a for-in or for-of statement
    checkForInit: function(init, type) {
    
        if (init.type === "VariableDeclaration") {
        
            // For-in/of may only have one variable declaration
            
            if (init.declarations.length !== 1)
                this.fail("for-" + type + " statement may not have more than one variable declaration", init);
            
            // A variable initializer is only allowed in for-in where 
            // variable type is "var" and it is not a pattern
                
            var decl = init.declarations[0];
            
            if (decl.init && (
                type === "of" ||
                init.keyword !== "var" ||
                decl.pattern.type !== "Identifier")) {
                
                this.fail("Invalid initializer in for-" + type + " statement", init);
            }
            
        } else {
        
            // Transform object and array patterns
            this.transformPattern(init, false);
        }
    },
    
    // Returns true if the specified name type is a duplicate for a given set of flags
    isDuplicateName: function(type, flags) {
    
        if (!flags)
            return false;
        
        switch (type) {
        
            case PROP_ASSIGN: return (this.context.strict || flags !== PROP_ASSIGN);
            case PROP_GET: return (flags !== PROP_SET);
            case PROP_SET: return (flags !== PROP_GET);
            default: return !!flags;
        }
    },
    
    // Checks for duplicate property names in object literals or classes
    checkInvalidNodes: function() {
    
        var context = this.context,
            list = context.invalidNodes,
            node,
            i;
        
        if (list === null)
            return;
        
        for (i = 0; i < list.length; ++i) {
        
            node = list[i];
            
            if (node.error)
                this.fail(node.error, node);
        }
        
        context.invalidNodes = null;
    }
    
}});
exports.Validate = Validate;
};

__require(0, exports);


}, ["fs","path","http","url"]);