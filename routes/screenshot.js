var router = require('express').Router(),
    OAuthServer = require('express-oauth-server'),
    aws = require('aws-sdk'),
    multer = require('multer'),
    multerS3 = require('multer-s3'),
    crypto = require('crypto'),
    path = require('path'),
    screenshot = require('../model/Screenshot'),
    async = require('async'),
    queue = require('../model/Queue');

this._conn = require('../model/mysql-db').getPool();

// set up oauth server
var oauth = new OAuthServer({
    model: require('../model'),
});

aws.config.update(global.config.aws);

var s3 = new aws.S3();

const successResponse = JSON.stringify({"success": true});

var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: global.config.aws.screenshotBucket,
        key: function(req, file, cb) {
            var filename = file.originalname;
            console.log("filename: ", filename);
            cb(null, filename);
        }
    })
});

router.post('/add', oauth.authenticate(), upload.single('file'), (req, res, next) => { 
    // Client must POST a multipart upload with fields:
    // "file": the image
    // "job_id": optional, the job to complete
    // "room_id": the id of the room
    // "key": the type of screenshot
    var fields = req.body;
    console.log('req.body', req.body); 
    fields.value = req.file.location;
    if (fields.room_id) fields.room_id = parseInt(fields.room_id, 10);
    async.waterfall([ 
        function addScreenshot(callback) {
            screenshot.addScreenshot(fields, callback);
        },
        function completeJob(callback) {
            if (fields.job_id) {
                // complete the job
                queue.finishJob(fields.job_id, callback);
            }
            else return callback();
        }],
        function done(err) {
            // handle errors
            if (err) {
                console.log('error', err);
                return res.json({"success": false, "error": err.message});
            }
            return res.set("Content-type", "application/json").send(successResponse);
        }
    );
});

router.get('/get', (req, res) => {
    if (!req.query.url) 
        return res.json({"success": false, "error": "Must provide a URL parameter"});
    var key = req.query.key || '%'; 
    var url = req.query.url;
    screenshot.requestScreenshot(url, key, (err, results) => {
        if (err) {
            console.log(err);
            return res.json({"success": false, "error": err.message});
        }
        return res.json({"success": true, "data": 'https://' + global.config.aws.screenshotBucket + '.s3.amazonaws.com/' + results[0].base_filename});
    });
});

module.exports = router;
