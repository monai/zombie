var Zombie = require("../lib/zombie.js");

module.exports = function(grunt) {
    "use strict";
    
    grunt.registerMultiTask("zombie", "Render zombie pages.", function() {
        var data, zombie, conf, pages, name, path;
        
        data = this.data;
        zombie = data.instance;
        
        if (!(zombie instanceof Zombie)) {
            zombie = Zombie.gruntFix(zombie);
        }
        
        conf = data.conf;
        conf = Object.keys(conf).map(function(key) {
            return grunt.template.process(conf[key]);
        });
        zombie.setConf(conf);
        
        grunt.log.writeln("Rendering static files:");
        pages = zombie.getByType(Zombie.PAGE);
        pages.forEach(function(page) {
            name = page.name;
            path = zombie.renderFile(name);
            grunt.log.writeln(path);
        });
    });
};
