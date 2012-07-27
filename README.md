Brraaaiiins!

    var Zombie = require("zombie").Zombie;
    
    Zombie()
    .partial({
        file: "_header.html",
        partials: ["subheader"]
    })
    .partial({
        file: "_subheader.html",
    })
    .partial({
        file: "_footer.html"
    })
    .partial({
        file: "_layout.html"
    })
    .page({
        file: "index.html",
        layout: "layout",
        partials: ["header", "footer"]
    })
    .page({
        file: "other.html",
        layout: "layout",
        partials: ["header", "footer"]
    })
    .run();

Rise zombie:

    node ./app.js serve
