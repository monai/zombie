"use strict";

var fs, path, util, ejs,
    version, program;
fs = require("fs");
path = require("path");
util = require("./util");
ejs = require("ejs");
program = require("./program");

version = "0.0.3";

function Zombie() {
    if (!(this instanceof Zombie)) {
        return new Zombie();
    }
    
    this._conf = {
        src: "src",
        dest: "dist",
        env: "dev",
        cache: Zombie.PARTIAL
    };
    
    this._props = {
        env: this._conf.env
    };
    
    this._nodes = {};
}
module.exports = Zombie;

Zombie.ALL = "all";
Zombie.NONE = "none";
Zombie.PARTIAL = "partial";
Zombie.PAGE = "page";

Zombie.version = version;

Zombie.gruntFix = function gruntFix(instance) {
    instance = util.extend(new Zombie(), instance);
    for (var i in instance._nodes) {
        if (instance._nodes.hasOwnProperty(i)) {
            instance._nodes[i] = util.extend(new Node(), instance._nodes[i]);
        }
    }
    return instance;
};

util.extend(Zombie.prototype, {
    getConf: function getConf() {
        return this._conf;
    },
    
    setConf: function setConf(conf) {
        util.extend(this._conf, conf);
        if (conf.env) {
            this._props.env = conf.env;
        }
    },
    
    configure: function configure(conf) {
        this.setConf(conf);
        return this;
    },
    
    properties: function properties(props) {
        util.extend(this._props, props);
        return this;
    },
    
    partial: function partial(skel) {
        var prepared = this._prepareSkel(skel);
        this._addToTree(prepared, Zombie.PARTIAL);
        return this;
    },
    
    page: function page(skel) {
        var prepared = this._prepareSkel(skel);
        this._addToTree(prepared, Zombie.PAGE);
        return this;
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
    
    renderFile: function renderFile(name) {
        var src, dest, node, content, file;
        src = this._conf.src;
        dest = this._conf.dest;
        node = this._getNode(name);
        content = this.render(name);
        
        file = path.relative(src, dest);
        file = path.resolve(path.dirname(node.file), file);
        file = path.join(file, path.basename(node.file));
        
        fs.writeFileSync(file, content);
        return file;
    },
    
    connect: function connect() {
        return this._connectHandler.bind(this);
    },
    
    run: function run(filename) {
        if (!filename || filename === process.argv[1]) {
            program(this);
        }
        return this;
    },

    _renderNode: function _renderNode(name, props) {
        var node, nodeProps, nodeRendered,
            varname, layout, partials = {};
        props = props || {};
        node = this._getNodeOrDefault(name);
        layout = this._getNode(node.layout);
        
        if (node.partials) {
            node.partials.forEach((function(name) {
                partials[name] = this._renderNode(name);
            }).bind(this));
        }
        
        nodeProps = node.properties || {};
        nodeProps = util.extend({}, this._props, partials, nodeProps, props);
        nodeRendered = node.render(nodeProps);
        
        if (layout instanceof Node) {
            varname = node.varname || "content";
            nodeProps[varname] = nodeRendered;
            return this._renderNode(node.layout, nodeProps);
        } else {
            return nodeRendered;
        }
    },
    
    _prepareSkel: function _prepareSkel(skel) {
        var name, ext, file;
        if (!skel.name) {
            if (skel.file) {
                file = skel.file;
                name = path.basename(file);
                ext = path.extname(name);
                name = name.substr(0, name.indexOf(ext));
                name = name.replace(/^\_/, "");
                name = util.dashToCamel(name);
                skel.name = name;
            } else {
                throw new Error("Property file must be present.");
            }
        }
        return skel;
    },
    
    _addToTree: function _addToTree(skel, type) {
        var node, partialNode, partials, error;
        if (!skel.name) {
            switch (type) {
            case Zombie.PARTIAL:
                error = "Partial name is not defined.";
                break;
            case Zombie.PAGE:
                error = "Page name is not defined.";
                break;
            }
            
            throw new Error(error);
        }
        
        node = this._createNode(skel, type);
        if (node) {
            if (node.partials) {
                node.partials.forEach((function(name) {
                    partialNode = this._getNode(name);
                    partials = (partialNode && partialNode.partials) ? partialNode.partials : null;
                    if (partials && partials.indexOf(node.name) > -1) {
                        throw new Error(node.name + " and " + partialNode.name + " references each other as partials");
                    }
                }).bind(this));
            }
            
            this._addNode(node);
        }
    },
    
    _createNode: function _createNode(skel, type) {
        skel.type = type;
        skel.file = path.join(this._conf.src, skel.file);
        skel.cache = this._conf.cache === Zombie.ALL || this._conf.cache === type;
        return new Node(skel);
    },
    
    _addNode: function _addNode(node) {
        this._nodes[node.name] = node;
    },
    
    _getNode: function _getNode(name) {
        return this._nodes[name];
    },
    
    _getNodeOrDefault: function _getNodeOrDefault(name) {
        var node = this._getNode(name);
        if (node) {
            return node;
        } else {
            node = new NullNode({ name: name, type: Zombie.PARTIAL });
            this._addNode(node);
        }
        return node;
    },
    
    _connectHandler: function _connectHandler(req, res, next) {
        var url, name,
            pages, page, indexContent,
            out = null;
        url = req.url;
        url = url.substr(0, url.indexOf("?")) || url;
        
        if ("/" === url) {
            pages = this.getByType(Zombie.PAGE);
            pages = pages.map(function(page) {
                return page.name;
            });
            indexContent = fs.readFileSync(__dirname + "/public/index.html", "utf8");
            
            out = ejs.render(indexContent, { pages: pages });
        } else {
            name = url.substr(1, url.length - 1);
            page = this.getByName(name);
            
            if (page) {
                out = this.render(name);
            }
        }
        
        if (out !== null) {
            res.end(out);
        } else {
            next();
        }
    }
});

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
            try {
                content = this._readFile();
            } catch (e) {
                content = "[file " + this.file + " not found]";
            }
            
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

function NullNode(skel) {
    Node.call(this, skel);
}

util.inherits(NullNode, Node);

util.extend(NullNode.prototype, {
    render: function render() {
        return "[partial " + this.name + " is not defined]";
    }
});
