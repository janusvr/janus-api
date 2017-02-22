var mysqldb = require('./mysql-db');
var queue = require('./Queue');
var roomCatalogue = require('./RoomCatalogue');

function Screenshot() {
    this._conn = mysqldb.getPool();

    this._createQry = "CREATE TABLE IF NOT EXISTS `screenshots` ("
                    + " `screenshot_id` INT(11) NOT NULL AUTO_INCREMENT, PRIMARY KEY(`screenshot_id`),"
                    + " `room_id` INT(11),"
                    + " `url` VARCHAR(512),"
                    + " `key` VARCHAR(512) NOT NULL,"
                    + " `value` VARCHAR(512) NOT NULL,"
                    + " `ts` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                    + ")";
    this._conn.query(this._createQry, () => { console.log('created table')});

    this._getScreenByIdQry = "SELECT * FROM `screenshots` WHERE `room_id` = ? AND screenshots.key LIKE ?";
    this._getScreenByUrlQry = "SELECT * FROM `screenshots`"
                            + " LEFT JOIN `room_catalogue`"
                            + " ON screenshots.room_id = room_catalogue.room_id " 
                            + " WHERE room_catalogue.url LIKE ? AND screenshots.key LIKE ? ";
    this._addScreenQry = "INSERT INTO `screenshots` (`room_id`, `key`, `value`) VALUES (?, ?, ?)";
    this._addScreenByUrlQry = "INSERT INTO `screenshots` (`url`, `key`, `value`) VALUES (?, ?, ?)";
}

Screenshot.prototype.requestScreenshot = function(url, key, cb) {
    // checks if the room exists in the catalogue, then checks
    // if the room has a screenshot
    // if screenshot exists, return the screenshot
    // if not, create a job in the queue
    roomCatalogue.getRoom(url, (err, rooms) => {
        // does the room exist in the catalogue?
        if (err) return cb(err);
        if (rooms.length > 0) {
            // yes, check if screenshots exist
            var room_id = rooms[0].room_id;
            this.getScreenshotByUrl(url, key, (err, screenshots) => {
                if (err) return cb(err);
                if (screenshots.length > 0)
                    return cb(null, screenshots)
                else {
                    // add job
                    queue.addJob(room_id, url, (err, res) => {
                        return cb(err, res);
                    });
                }
            });
        }
        else {
            // no room in the catalogue, add one, then add a job 
            roomCatalogue.addRoom({url: url}, (err, room_id) => {
                // add job
                if (err) return cb(err);
                queue.addJob(room_id, url, err => {
                    return cb(err, null);
                });
            });
        }   
    });
}

Screenshot.prototype.getScreenshot = function(room_id, key, cb) {
    this._conn.query(this._getScreenByIdQry, [room_id, key], (err, res) => {
        if (err) return cb(err);
        return cb(null, res);
    });
}

Screenshot.prototype.getScreenshotByUrl = function(url, key,  cb) {
    this._conn.query(this._getScreenByUrlQry, [url, key], (err, res) => {
        if (err) return cb(err);
        return cb(null, res);
    });
}

Screenshot.prototype.addScreenshot = function(opts, cb) {
    //  options: {
    //      room_id: int,
    //      key: string,
    //      value: string 
    //  }
    this._conn.query(this._addScreenByUrlQry, [opts.url, opts.key, opts.value], (err, res) => {
        if (err) return cb(err);
        return cb(null);
    });
}

module.exports = new Screenshot();
