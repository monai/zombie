var fs, program, connect, zombie;
fs = require("fs");
program = require("commander");
connect = require("connect");

function run(z) {
    var argv;
    zombie = z;
    program
        .version(zombie.version)
        .option("-e, --env <env>", "specify environment")
        .option("-p, --port <port>", "specify the port [3000]", Number, 3000);
    program
        .command("render")
        .description("renders pages to static files")
        .action(render);
    program
        .command("serve")
        .description("runs HTTP server on port [port]")
        .action(serve);
    
    argv = process.argv;
    if (argv.length == 2) {
        argv.push("-h");
    }
    program.parse(argv);
}
module.exports = run;

function render(env) {
    var Zombie, pages, name, redered;
    Zombie = zombie.constructor;
    pages = zombie.getByType(Zombie.PAGE);
    pages.forEach(function(page) {
        name = page.name;
        rendered = zombie.render(name);
        fs.writeFileSync(zombie.conf.dist + "/" + name + ".html", rendered);
    });
}

function serve(env) {
    connect()
        .use(connect.logger("dev"))
        .use(connect.static(zombie.conf.src))
        .use(zombie.connect())
        .listen(3000);
}
