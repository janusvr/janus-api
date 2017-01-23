var router = require("express").Router();
this._conn = require("../model/mysql-db").getPool();
var queue = require("../model/Queue");


router.get('/get', (req, res) => {
    queue.getJob((err, job) => {
       if (err) return res.json({"success": false, "error": err.message});
        return res.json({"success": true, "data": job}); 
    }); 
}); 

module.exports = router;
