module FS from "node:fs";
module REPL from "node:repl";
module VM from "node:vm";
module Path from "node:path";

import { translate } from "Translator.js";
import { isPackageURI, locatePackage } from "PackageLocator.js";
import { ConsoleStyle as Style } from "package:zen-bits";


var ES6_GUESS = /(?:^|\n)\s*(?:import|export|class)\s/;


function formatSyntaxError(e, text, filename) {

    var msg = e.message;
    
    if (filename)
        msg += "\n    at " + filename + ":" + e.line;
    
    if (e.lineOffset < text.length) {
    
        msg += "\n\n" +
            text.slice(e.lineOffset, e.startOffset) +
            Style.bold(Style.red(text.slice(e.startOffset, e.endOffset))) + 
            text.slice(e.endOffset, text.indexOf("\n", e.endOffset)) + "\n";
    }
    
    return msg;
}

function addExtension() {

    var Module = module.constructor,
        resolveFilename = Module._resolveFilename;
    
    Module._resolveFilename = (filename, parent) => {
    
        if (isPackageURI(filename))
            filename = locatePackage(filename);
        
        return resolveFilename(filename, parent);
    };
    
    // Compile ES6 js files
    require.extensions[".js"] = (module, filename) => {
    
        var text, source;
        
        try {
        
            text = source = FS.readFileSync(filename, "utf8");
            
            if (ES6_GUESS.test(text))
                text = translate(text);
        
        } catch (e) {
        
            if (e instanceof SyntaxError)
                e = new SyntaxError(formatSyntaxError(e, source, filename));
            
            throw e;
        }
        
        return module._compile(text, filename);
    };
}

export function runModule(path) {

    addExtension();
        
    var path = Path.resolve(process.cwd(), path),
        stat;

    try { stat = FS.statSync(path) }
    catch (x) {}

    if (stat && stat.isDirectory())
        path = Path.join(path, "main.js");

    var m = require(path);

    if (m && typeof m.main === "function")
        Promise.cast(m.main()).catch(x => setTimeout($=> { throw x }, 0));
}

export function startREPL() {

    addExtension();

    var repl = REPL.start({ 
    
        prompt: "es6> ",
        
        eval(input, context, filename, cb) {
        
            var text, result;
            
            try {
            
                text = translate(input, { wrap: false });
            
            } catch (x) {
            
                if (x instanceof SyntaxError)
                    x = new SyntaxError(formatSyntaxError(x, input));
                
                return cb(x);
            }
            
            try {
            
                result = context === global ? 
                    VM.runInThisContext(text, filename) : 
                    VM.runInContext(text, context, filename);
                
            } catch (x) {
            
                cb(x);
            }
            
            cb(null, result);
        }
    });
}