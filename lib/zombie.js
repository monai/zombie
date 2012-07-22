"use strict";

var util, fs, ejs;
util = require("./util.js");
fs = require("fs");
ejs = require("ejs");

function Zombie() {
    this._conf = {
        src: "../src/",
        dist: "../dist",
        cache: Zombie.PARTIAL
    };
    
    this._nodes = {};
}

Zombie.ALL = "all";
Zombie.NONE = "none";
Zombie.PARTIAL = "partial";
Zombie.PAGE = "page";

util.extend(Zombie.prototype, {
    configure: function configure(conf) {
        util.extend(this._conf, conf);
    },
    
    partial: function partial(skel) {
        this._addToTree(skel, Zombie.PARTIAL);
    },
    
    page: function page(skel) {
        this._addToTree(skel, Zombie.PAGE);
    },
    
    getByName: function getByName(name) {
        return this._nodes[name];
    },
    
    getByType: function getByType(type) {
        var out = [];
        for (var key in this._nodes) {
            if (type === this._nodes[key].type) {
                out.push(this._nodes[key]);
            }
        }
        return out;
    },
    
    render: function render(name) {
        if (Array.isArray(name)) {
            return name.map((function(name) {
                return this._renderNode(name);
            }).bind(this));
        } else {
            return this._renderNode(name);
        }
    },
    
    _renderNode: function _renderNode(name) {
        var node, nodeRendered, layout, layoutRendered, partials = {};
        node = this._nodes[name];
        layout = this._nodes[node.layout];
        
        node.partials.forEach((function(name) {
            var partial = this._nodes[name];
            partials[name] = partial.render();
        }).bind(this));
        
        nodeRendered = node.render(partials);
        
        if (layout) {
            return layout.render({ content: nodeRendered });
        } else {
            return nodeRendered;
        }
    },
    
    _addToTree: function _addToTree(skel, type) {
        var name, node;
        name = skel.name;
        skel.type = type;
        skel.file = this._conf.src + skel.file;
        skel.cache = this._conf.cache === Zombie.ALL || this._conf.cache === type;
        
        this._nodes[name] = new Node(skel);
    }
});

exports.Zombie = Zombie;

function Node(skel) {
    util.extend(this, skel);
    this._modified = null;
    this._rendered = null;
}

util.extend(Node.prototype, {
    render: function render(props) {
        var fileContent;
        
        if (this._rendered && !this._wasModified()) {
            return this._rendered;
        } else {
            fileContent = this._readFile();
            fileContent = ejs.render(fileContent, props);
            if (this.cache) {
                this._modified = this._getModifiedTime();
                this._rendered = fileContent;
            }
            return fileContent;
        }
    },
    
    _readFile: function _readFile() {
        return fs.readFileSync(this.file, "utf8");
    },
    
    _getModifiedTime: function _getModifiedTime() {
        return fs.statSync(this.file).mtime.getTime();
    },
    
    _wasModified: function _wasModified() {
        var time = this._getModifiedTime();
        if (!this._modified) {
            return true;
        } else {
            if (this._modified < time) {
                this._modified = time;
                return true;
            } else {
                return false;
            }
        }
    }
});
