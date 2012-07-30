module.exports = function(grunt) {
    var zombie = this;
    grunt.registerMultiTask("zombie", "Render zombie pages.", function() {
        var Zombie, pages, name, path;
        Zombie = zombie.constructor;
        pages = zombie.getByType(Zombie.PAGE);
        zombie.setConf(this.data);
        
        grunt.log.writeln("Rendering static files:");
        pages.forEach(function(page) {
            name = page.name;
            path = zombie.renderFile(name);
            grunt.log.writeln(path);
        });
    });
};
