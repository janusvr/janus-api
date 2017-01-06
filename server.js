var http = require('http'),
    https = require('https'),
    bodyParser = require('body-parser'),
    express = require('express');

// set up the global config
if (typeof(global.config) === "undefined")
    global.config = require('./config.js');

function Server() {}

// start web server 
Server.prototype.start = function (cb) {
    this.ws = express();
    
    // set up body-parser
    this.ws.use(bodyParser.json({ type: "application/json" }));
    //this.ws.use(bodyParser.raw({ type: "application/x-www-form-urlencoded"}));
    this.ws.use(bodyParser.urlencoded({ extended: false}));
 
    // include routes
    var router = require("./routes/index.js");
    this.ws.use(router);

    // start http server
    this.webserver = http.createServer(this.ws)
    this.webserver.listen(config.webServerPort, "::");
    console.log('Webserver (http) started on port: ' + config.webServerPort);
    
    // start https server
    this.webserverHttps = https.createServer(config.ssl.options, this.ws).listen(config.ssl.port);
    console.log('Webserver (https) started on port: ' + config.ssl.port);
    
    // log start time
    console.log('Start Date/Time: ' + Date());

    // call the callback if provided
    if (typeof(cb) === "function")
        cb();
};

Server.prototype.close = function (cb) {
    this.webserver.close( err => {
        return cb(err);
    });
}

if (require.main === module) {
    (new Server()).start();
}
else {
    module.exports = Server;
}

