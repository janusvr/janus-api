var router = require("express").Router();
this._conn = require("../model/mysql-db").getPool();
var queue = require("../model/Queue");

router.get('/get', (req, res) => {
    queue.getJob((err, job) => {
       if (err) return res.json({"success": false, "error": err.message});
        return res.json({"success": true, "data": job}); 
    }); 
}); 

router.get('/peek', (req, res) => {
    var job_id = req.query.job_id || undefined;
    var url = req.query.url || undefined;
    if (!job_id && !url)
        return res.json({"success": false, "error": "Must supply job_id or url"});
    if (job_id && url)
        return res.json({"success": false, "error": "Suply EITHER job_id OR url, not both"});
    var opts = {
        job_id: job_id,
        url: url
    };
    queue.checkJob(opts, (err, rows) => {
        if (err)
            return res.json({"success": false, "error": err.message});
        return res.json({"success": true, "data": rows});
    });
});

module.exports = router;
