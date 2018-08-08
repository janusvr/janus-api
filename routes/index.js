var mysql = require('mysql'),
    async = require('async'),
    express = require('express'),
    redis = require('redis'),
    redisClient = redis.createClient(global.config.redis),
    OAuthServer = require('express-oauth-server');

this._conn = require('../model/mysql-db').getPool();

var router = express.Router();
// set up oauth server
global.oauth = new OAuthServer({
    model: require('../model/oauth-redis'),
});

router.post('/oauth/token', oauth.token());

var _presence;

function getToken(req, res, next) {
    if (!!req.headers.authorization)
        req.token = req.headers.authorization.split(" ")[1];
    else req.token = null;
    return next();
}

router.get('/secret', oauth.authenticate({scope: 'secret'}), getToken, (req, res) => {
    res.send('Secret');
});


// get all users online, remove offline users from party mode results and return
function filterStuckUsers(partyData)
{
    var sql = "SELECT userId FROM users WHERE updated_at > DATE_SUB(NOW() , INTERVAL 10 SECOND) ORDER BY userId";
    _presence.query(sql, function(err, result) {
        if (err) {
            console.log(err);
            return partyData;
        }
        var onlineUsers = [];
        var rows = JSON.parse(JSON.stringify(result));
        for (var i in rows)
        {
            onlineUsers.push(rows[i].userId);
        }
        var i = partyData.length;
        while (i--)
        {
            if (partyData[i].userId)
            {
                if (!onlineUsers.includes(partyData[i].userId))
                {
                    partyData.splice(i,1);
                }
            }
        }
        return partyData;
    });
    return partyData;
}

if (global.config.apis.karanStudy.enabled) {
    var studyModel = require('../model/karanStudy.js'),
        multer = require('multer')();
    router.post('/karanStudy', multer.none(), function(req, res) {
        // takes a string, adds it to db table
        var str = req.body.string;
        studyModel.post(str, (err, rows) => {
            if (err) return res.status(502).send('Error adding strings: ' + err.message);
            return res.status(200).send('test'); 
        });
    });
    router.get('/karanStudy', function(req, res) {
        // grabs all rows from table, return as csv with newlines
        studyModel.get( (err, rows) => {
            if (err) return res.status(502).send('Error getting strings');
            var response = rows.map((x) => { return x.studyResponse }).join('\n');
            res.set({
                'Content-Disposition': 'attachment; filename="study.txt"',
                'Content-Type': 'text/plain',
                'Content-Length': response.length
            });
            return res.send(response);
        }); 
    });
}


if (global.config.apis.screenshot.enabled) {
    router.use('/screenshot', require('./screenshot'));
    router.use('/queue', require('./queue'));
}

if (global.config.apis.user.enabled) {
    router.use('/user', require('./user'));
}

router.use('/room', require('./room'));


if (global.config.apis.popularRooms.enabled) {
    router.get('/getPopularRooms', function (req, res) {
        var limit = parseInt(req.query.limit, 10) || 20,
            offset = parseInt(req.query.offset, 10) || 0,
            orderBy = req.query.orderBy || req.query.orderby || "weight",
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
    _presence = mysql.createPool({
        host     : config.MySQL_Hostname,
        user     : config.MySQL_Username,
        password : config.MySQL_Password,
        database : config.apis.partyList.presence_db
    });
    
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
                rval.data = filterStuckUsers(rval.data);
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
    const getLogQuery = "SELECT * FROM log WHERE maxftGPU != 2147483648 AND maxftCPU != 2147483648;";

    router.post('/perflog', (req, res) => {
        if (!Object.prototype.hasOwnProperty.call(req.body, 'data'))
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

    router.get('/perflog', (req, res) => {
        // TODO: pipe the db response into the http response, reduce redundant data
        this._perflog.query(getLogQuery, (err, results) => {
            if (err) return res.json({"success": false, "error": "DB error"});
            return res.json({"success": true, "data": results});
        });
    });
    router.get('/perflog/view', (req, res, next) => {
        res.render('perflog');
    });
}



router.get('/', function (req, res) {
    res.send(200, '');
});

module.exports = router;
