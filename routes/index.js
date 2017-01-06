var bodyParser = require('body-parser'),
    express = require('express'),
    mysql = require('mysql'),
    async = require('async'),
    bodyParser = require('body-parser'),
    redis = require('redis'),
    redisClient = redis.createClient(global.config.redis),
    OAuthServer = require('express-oauth-server');

this._conn = mysql.createPool({
    host     : config.MySQL_Hostname,
    user     : config.MySQL_Username,
    password : config.MySQL_Password,
    database : config.MySQL_Database
});


var router = express.Router();
// set up oauth server
var oauth = new OAuthServer({
    model: require('../model'),
});

router.post('/oauth/token', oauth.token());

router.get('/secret', oauth.authenticate(), (req, res) => {
    res.send('Secret');
});

if (global.config.apis.popularRooms.enabled) {
    router.get('/getPopularRooms', function (req, res) {
        var limit = parseInt(req.query.limit, 10) || 20,
            offset = parseInt(req.query.offset, 10) || 0,
            orderBy = req.query.orderBy || "weight",
            desc = (req.query.desc && req.query.desc === "true") ? "DESC" : "",
            contains = req.query.urlContains ? "%" + req.query.urlContains + "%" : "%";
        var sql = "SELECT roomName, url as roomUrl, count, weight,";
            sql += " UNIX_TIMESTAMP(lastSeen) as lastEntered, thumbnail";
            sql += " FROM `popular` WHERE url LIKE ? ORDER BY ?? "+desc+" LIMIT ?,?";
        this._conn.query(sql, [contains, orderBy, offset, limit], function(err, results) {
            if (err) { 
                console.log(err);
                res.json({"success": false, "data": [{"error": "Error querying the DB"}]});
                return;
            }
            
            res.json({"success": true, "data": results});
        })
    }.bind(this));
}

if (global.config.apis.addThumb.enabled) {
    router.post('/addThumb', function (req, res) {
        data = req.body;
        if (!data['token'] || 
            data['token'] !== global.config.apis.addThumb.masterToken)
            return res.json({"success": false, "data": [{"error": "Invalid token"}]});
        if (!data['roomUrl'] || !data['thumbnail']) 
            return res.json({"success": false, "data": [{"error": "Must POST roomUrl and thumbnail parameters"}]});
        var roomUrl = data['roomUrl'],
            thumbnail = data['thumbnail'];
        var sql = "UPDATE popular SET thumbnail = ? WHERE url = ?";
        this._conn.query(sql, [thumbnail, roomUrl], (err, results) => {
            if (err) {
                console.log(err);
                return res.json({"success": false, "data": [{"error": "Error querying the DB"}]});
            }
            return res.json({"success": true});
        });
    }.bind(this));
}

if (global.config.apis.partyList.enabled) {
    router.get('/get_partylist', function (req, res) {
        redisClient.get("partylist", (err, reply) => {
            if (err) 
                return res.json({"success": false});
            return res.json(JSON.parse(reply.toString())); 
        });
    });

    router.get('/partymodeAPI', function (req, res) {
        redisClient.get("partylist", (err, reply) => {
            if (err)
                return res.json({"success": false});
            var partyList = JSON.parse(reply.toString()), 
                rval = {success: "true", data: []};
            async.each(Object.keys(partyList), function(key, cb) {
                var newObj = {
                    userId: key,
                    roomId: partyList[key].roomId,
                    url: partyList[key].roomUrl,
                    name: partyList[key].roomName,
                };
                rval.data.push(newObj);
                cb();
            }, function(err) {
                if (err)
                    return res.json({"success": false});
                return res.json(rval);
            });
        });
    });
}

if (global.config.apis.perfLog.enabled) {
    this._perflog = mysql.createPool({
        host     : config.MySQL_Hostname,
        user     : config.MySQL_Username,
        password : config.MySQL_Password,
        database : config.apis.perfLog.db
    });
    router.post('/perflog', (req, res) => {
        if (!req.body.hasOwnProperty('data'))
            return res.json({"succes": false, "error": "Must include data parameter"});
        var data = JSON.parse(req.body.data);
        var fields = {
            "version": data.version || "0", // decimal: XX.YY
            "resx": data.res[0] || 0, // int
            "resy": data.res[1] || 0,
            "msaa": data.msaa || 0, // int
            "fov": data.fov || 0, // float
            "url": data.url || "", //varchar(256)
            "hash": data.hash || "", // varchar(64)
            "minftCPU": data.minftCPU || 0, // float
            "medianftCPU": data.medianftCPU || 0,  // float
            "maxftCPU": data.maxftCPU || 0,  // float
            "minftGPU": data.minftGPU || 0, // float
            "medianftGPU": data.medianftGPU || 0, // float
            "maxftGPU": data.medianftGPU || 0, // float
            "OS": data.OS || "", // float
            "sysmem": data.sysmem || 0, // float 
            "processorvendor": data.processorvendor || "", // varchar(256)
            "processordevice": data.processordevice || "", // varchar(256)
            "gpuvendor": data.gpuvendor || "", // varchar (256)
            "gpudevice": data.gpudevice || "", // varchar(256)
            "gpudriverversion": data.gpudriverversion || "", // varchar(256)
            "rendermode": data.rendermode || "" //varchar(256)
        }
        var sql = "INSERT into `log` SET ?";
        this._perflog.query(sql, fields, (err, result) => {
            if (err) 
                return res.json({"success": false, "error": "DB insert error"+err.toString()});
            else
                return res.json({"success": true, "error": "success"}); 
        });
    });
}
router.get('/', function (req, res) {
    res.send(200, '');
});

module.exports = router;
