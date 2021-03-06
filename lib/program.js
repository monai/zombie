"use strict";

var fs, util, program, connect,
    zombie, conf;
fs = require("fs");
util = require("./util");
program = require("commander");
connect = require("connect");

function run(z) {
    var argv;
    zombie = z;
    conf = zombie.getConf();
    program
        .version(z.constructor.version)
        .option("-e, --env <env>", "specify environment")
        .option("-H, --host <host>", "specify the hostname [0.0.0.0]", String, "0.0.0.0")
        .option("-p, --port <port>", "specify the port [3000]", Number, 3000)
        .option("-s, --silent", "do not write log to stdout");
    program
        .command("render")
        .description("renders pages to static files")
        .action(render);
    program
        .command("serve")
        .description("runs HTTP server on [host]:[port]")
        .action(serve);
    
    argv = process.argv;
    if (2 === argv.length) {
        argv.push("-h");
    }
    program.parse(argv);
}
module.exports = run;

function render() {
    var Zombie, pages, name, path;
    Zombie = zombie.constructor;
    pages = zombie.getByType(Zombie.PAGE);
    zombie.setConf({ env: program.env });
    
    if (!program.silent) {
        console.log("Rendering static files:");
    }
    pages.forEach(function(page) {
        name = page.name;
        path = zombie.renderFile(name);
        if (!program.silent) {
            console.log(path);
        }
    });
}

function serve() {
    var logger = (!program.silent) ? "dev" : util.nop;
    zombie.setConf({ env: program.env });
    connect()
        .use(connect.logger(logger))
        .use(zombie.connect())
        .use(connect.static(conf.src))
        .listen(program.port, program.host);
    if (!program.silent) {
        console.log("Listening on %s:%s", program.host, program.port);
    }
}
