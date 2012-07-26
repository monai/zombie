"use strict";

var util, fs, ejs;
util = require("./util.js");
fs = require("fs");
ejs = require("ejs");

function Zombie() {
    this._conf = {
        base: "../src",
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
    
    connect: function connect(req, res) {
        return this._connectHandler.bind(this);
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
        skel.file = this._conf.base + "/" + skel.file;
        skel.cache = this._conf.cache === Zombie.ALL || this._conf.cache === type;
        
        this._nodes[name] = new Node(skel);
    },
    
    _connectHandler: function _connectHandler(req, res) {
        var url, name,
            pages, page, indexContent,
            out;
        url = req.url;
        
        if (url === "/") {
            pages = this.getByType(Zombie.PAGE);
            pages = pages.map(function(page) {
                return page.name;
            });
            indexContent = fs.readFileSync(__dirname + "/public/index.html", "utf8");
            
            out = ejs.render(indexContent, { pages: pages });
        } else {
            name = url.substr(1, url.length - 1);
            page = this.getByName(name);
            
            out = page ? this.render(name) : "page not found";
        }
        res.end(out);
    }
});

exports.Zombie = Zombie;

function Node(skel) {
    util.extend(this, skel);
    this._modified = null;
    this._content = null;
}

util.extend(Node.prototype, {
    render: function render(props) {
        var content;
        
        if (this._content && !this._wasModified()) {
            content = this._content;
        } else {
            content = this._readFile();
            if (this.cache) {
                this._modified = this._getModifiedTime();
                this._content = content;
            }
        }
        
        return ejs.render(content, props);
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
