Brraaaiiins!

    Zombie = require("zombie").Zombie;
    z = new Zombie();
    connect = require("connect");
    
    z.configure({
        src: __dirname + "/src/",
        dist: __dirname + "/dist/",
    });
    
    z.partial({
        name: "header",
        file: "_header.html"
    });
    
    z.partial({
        name: "footer",
        file: "_footer.html"
    });
    
    z.partial({
        name: "layout",
        file: "_layout.html"
    });
    
    z.page({
        name: "index",
        file: "index.html",
        layout: "layout",
        partials: ["header", "footer"]
    });
    
    app = connect()
         .use(connect.logger("dev"))
         .use(connect.static(__dirname + "/src"))
         .use(z.connect())
         .listen(3000);
