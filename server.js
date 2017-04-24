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
 
    // Add CORS headers to all responses
    this.ws.use(function(req, res, next) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST');
	    if (req.headers['Access-Control-Request-Headers'] || req.headers['access-control-request-headers'])
            res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] + ', Authorization');
	    next();
    });
    //
    this.ws.use("/static", express.static('static'));
    // include routes
    var router = require("./routes/index.js");
    this.ws.set('view engine', 'pug');
    this.ws.use(router);

    // start http server
    this.webserver = http.createServer(this.ws)
    this.webserver.listen(config.webServerPort, "::");
    console.log('Webserver (http) started on port: ' + config.webServerPort);
   
     
    
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

