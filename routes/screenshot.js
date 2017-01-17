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
        acl: 'public-read',
        key: function(req, file, cb) {
            // create the filename (md5 hash of date + original extension)
            var extension = path.extname(file.originalname);
            var filename = crypto.createHash('md5')
                .update(Date.now().toString()).digest('hex') + extension;
            cb(null, filename);
        }
    })
});

router.post('/add', oauth.authenticate(), upload.array('file', 1), (req, res, next) => { 
    // Client must POST a multipart upload with fields:
    // "file": the image
    // "job_id": optional, the job to complete
    // "room_id": the id of the room
    // "key": the type of screenshot
    var fields = req.body; //FIXME: remove
    fields.value = req.files[0].location;
    fields.room_id = parseInt(fields.room_id, 10);
    async.waterfall([ 
        function addScreenshot(callback) {
            screenshot.addScreenshot(fields, callback);
        },
        function completeJob(err, callback) {
            if (fields.job_id) {
                // complete the job
                queue.finishJob(fields.job_id, callback);
            }
            else return callback();
        }],
        function done(err, results) {
            // handle errors
            if (err) return res.json({"success": false, "error": err.message});
            return res.set("Content-type", "application/json").send(successResponse);
        }
    );
});

module.exports = router;
