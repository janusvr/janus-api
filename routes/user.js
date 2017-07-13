var router = require('express').Router();
var pool = require('../model/mysql-promise-db').getPool();
var bcrypt = require('bcrypt');

function getToken(req, res, next) {
    if (!!req.headers.authorization) {
        req.token = req.headers.authorization.split(" ")[1];
    }
    else req.token = null;
    return next();
}

function unpackToken(req, res, next) {
    if (!req.token) return next();
    return pool.query("SELECT * FROM oauth_accessToken WHERE accessToken = ?;", [req.token]).then(rows => {
        if (rows.length === 0) return next();
        req.auth = rows[0];
        return next();
    });
}



router.post('/claimroom', oauth.authenticate(), getToken, unpackToken, (req, res) => {
    if (!req.body.url) return res.json({"success": false, "error": "Must include `url` parameter"});
    // TODO: for now, automatically accept all claims
    pool.query("INSERT INTO claimedRooms (url, hash, userId) VALUES (?, MD5(?), ?)", [req.body.url, req.body.url, req.auth.user])
    .then(() => {
        return res.json({"success": true});
    })
    .catch(err => {
        console.log(err);
        return res.json({"success": false, "error": "Room already claimed"});
    });  
});


function verifyRoomOwner(token, url) {
    return pool.query("SELECT * FROM claimedRooms WHERE url = ? AND userId = ?", [url, token.user])
    .then(rows => {
        if (rows.length === 0) return;
        else return true;
    });
}

router.post('/lockroom', oauth.authenticate(), getToken, unpackToken, (req, res) => {
    // FIXME: bad structure
    if (!req.body.password || !req.body.url) return res.json({"success": false, "error": "Must include `password` and `url` parameters"});
    return verifyRoomOwner(req.auth, req.body.url).then(verified => {
        if (!verified) 
            return res.json({"success": false, "error": "You do not have permissions to lock that room"});
        return bcrypt.hash(req.body.password, 10).then(hash => {
            return pool.query("UPDATE claimedRooms SET password = ? WHERE url = ?", [hash, req.body.url]).then(() => {
                return res.json({"success": true});
            });
        });
    });
});

module.exports = router;
