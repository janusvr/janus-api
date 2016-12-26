var http = require('http'),
    https = require('https'),
    bodyParser = require('body-parser'),
    express = require('express');

if (typeof(global.config) === "undefined")
    global.config = require('./config.js');
function Server() {

}

// ## start web server ##
Server.prototype.start = function (cb) {
    this.ws = express();
    this.ws.use(bodyParser.json({ type: "application/json" }));
    this.ws.use(bodyParser.raw({ type: "application/x-www-form-urlencoded"}));
    var router = require("./routes/index.js");
    this.ws.use(router);


    this.webserver = http.createServer(this.ws)
    this.webserver.listen(config.webServerPort, "::");
    console.log('Webserver (http) started on port: ' + config.webServerPort);
    this.webserverHttps = https.createServer(config.ssl.options, this.ws).listen(config.ssl.port);
    console.log('Webserver (https) started on port: ' + config.ssl.port);
    console.log('Start Date/Time: ' + Date());

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

