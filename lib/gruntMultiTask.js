module.exports = function(grunt) {
    "use strict";
    
    var zombie = this;
    grunt.registerMultiTask("zombie", "Render zombie pages.", function() {
        var Zombie, pages, name, path, data;
        Zombie = zombie.constructor;
        pages = zombie.getByType(Zombie.PAGE);
        data = this.data;
        Object.keys(data).forEach(function(key) {
            data[key] = grunt.template.process(data[key]);
        });
        zombie.setConf(data);
        
        grunt.log.writeln("Rendering static files:");
        pages.forEach(function(page) {
            name = page.name;
            path = zombie.renderFile(name);
            grunt.log.writeln(path);
        });
    });
};
