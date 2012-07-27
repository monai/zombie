"use strict";

var util, fs, path, ejs, version, program;
util = require("./util");
fs = require("fs");
path = require("path");
ejs = require("ejs");

exports.version = version = "0.0.2";
exports.program = program = require("./program");

function Zombie() {
    if (!(this instanceof Zombie)) {
        return new Zombie();
    }
    
    this._conf = {
        src: "./src",
        dist: "./dist",
        env: "dev",
        cache: Zombie.PARTIAL
    };
    
    this._props = {
        env: this._conf.env
    };
    
    this._nodes = {};
}
exports.Zombie = Zombie;

Zombie.ALL = "all";
Zombie.NONE = "none";
Zombie.PARTIAL = "partial";
Zombie.PAGE = "page";

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
        var src, dist, node, content, file;
        src = this._conf.src;
        dist = this._conf.dist;
        node = this._getNode(name);
        content = this.render(name);
        
        file = path.relative(src, dist);
        file = path.resolve(path.dirname(node.file), file);
        file = path.join(file, path.basename(node.file));
        
        fs.writeFileSync(file, content);
        return file;
    },
    
    connect: function connect(req, res) {
        return this._connectHandler.bind(this);
    },
    
    run: function run() {
        return program(this);
    },
    
    _renderNode: function _renderNode(name) {
        var node, nodeProps, nodeRendered,
            layout, layoutProps, layoutRendered,
            partial, partials = {}, partialProps;
        node = this._getNodeOrDefault(name);
        layout = this._getNode(node.layout);
        
        if (node.partials) {
            node.partials.forEach((function(name) {
                partial = this._getNodeOrDefault(name);
                partialProps = partial.properties || {};
                partials[name] = this._renderNode(name);
            }).bind(this));
        }
        
        nodeProps = node.properties || {};
        util.extend(nodeProps, this._props, partials);
        nodeRendered = node.render(nodeProps);
        
        if (layout instanceof Node) {
            layoutProps = layout.properties || {};
            util.extend(layoutProps, this._props, { content: nodeRendered });
            return layout.render(layoutProps);
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
                skel.name = name;
            } else {
                throw new Error("File property must be present.");
            }
        }
        return skel;
    },
    
    _addToTree: function _addToTree(skel, type) {
        var node, partialNode, partials;
        if (!skel.name) {
            switch (type) {
            case Zombie.PARTIAL:
                throw new Error("Partial name is not defined.");
                break;
            case Zombie.PAGE:
                throw new Error("Page name is not defined.");
                break;
            }
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
    
    _connectHandler: function _connectHandler(req, res) {
        var url, name,
            pages, page, indexContent,
            out;
        url = req.url;
        
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
            
            out = page ? this.render(name) : "page not found";
        }
        res.end(out);
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
