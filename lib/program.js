var fs, util, program, connect, version, zombie;
fs = require("fs");
util = require("./util");
program = require("commander");
connect = require("connect");
version = require("./zombie").version;

function run(z) {
    var argv;
    zombie = z;
    program
        .version(version)
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
    if (argv.length == 2) {
        argv.push("-h");
    }
    program.parse(argv);
}
module.exports = run;

function render(env) {
    var Zombie, pages, name, path, redered,
        stream;
    stream = process.stdout;
    Zombie = zombie.constructor;
    pages = zombie.getByType(Zombie.PAGE);
    
    if (!program.silent) {
        console.log("Rendering static files:");
    }
    pages.forEach(function(page) {
        name = page.name;
        path = zombie.conf.dist + "/" + name + ".html";
        rendered = zombie.render(name);
        
        fs.writeFileSync(path, rendered);
        if (!program.silent) {
            console.log(path);
        }
    });
}

function serve(env) {
    var logger = (!program.silent) ? "dev" : util.nop;
    connect()
        .use(connect.logger(logger))
        .use(connect.static(zombie.conf.src))
        .use(zombie.connect())
        .listen(program.port, program.host);
    if (!program.silent) {
        console.log("Listening on %s:%s", program.host, program.port);
    }
}
