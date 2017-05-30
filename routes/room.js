var router = require('express').Router(),
    room = require('../model/room');

this._conn = require('../model/mysql-db').getPool();

module.exports = router;

router.get('/get', (req, res) => {
    var url = req.query.url;
    room.get(url, (err, room) => {
        if (err) 
            return res.json({"success": false, "error": err.message});
        return res.json({"success": true, "data": room});
    });    
}); 

router.get('/search', (req, res) => {
    var params = req.query;
    if (Object.keys(params).length === 0)
        return res.json({"success": false, "error": "Please send some parameters"});
    else {
        room.search(params, (err, rooms) => {
            if (err)
                return res.json({"success": false, "error": err.message});
            return res.json({"success": true, "data": rooms});
        });
    }
});
