var bodyParser = require('body-parser'),
    express = require('express'),
    mysql = require('mysql'),
    bodyParser = require('body-parser');


this._conn = mysql.createPool({
    host     : config.MySQL_Hostname,
    user     : config.MySQL_Username,
    password : config.MySQL_Password,
    database : config.MySQL_Database
});

var router = express.Router();

if (global.config.apis.popularRooms.enabled) {
    router.get('/getPopularRooms', function (req, res) {
        var limit = parseInt(req.query.limit, 10) || 20,
            offset = parseInt(req.query.offset, 10) || 0,
            orderBy = req.query.orderBy || "weight",
            desc = (req.query.desc && req.query.desc === "true") ? "DESC" : "",
            contains = req.query.urlContains ? "%" + req.query.urlContains + "%" : "%";
        var sql = "SELECT roomName, url as roomUrl, count, weight, UNIX_TIMESTAMP(lastSeen) as lastEntered, thumbnail FROM `popular` WHERE url LIKE ? ORDER BY ?? "+desc+" LIMIT ?,?";
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
        res.json({"success": false, "data": [{"error": "Not implemented"}]});
    });
}
router.get('/', function (req, res) {
    res.send(200, '');
});

module.exports = router;
