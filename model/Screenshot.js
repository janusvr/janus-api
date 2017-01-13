var mysqldb = require('./mysql-db');
var queue = require('./Queue');
var roomCatalogue = require('./RoomCatalogue');

function Screenshot() {
    this._conn = mysqldb.getPool();

    this._createQry = "CREATE TABLE IF NOT EXISTS `screenshots` ("
                    + " `screenshot_id` INT(11) NOT NULL AUTO_INCREMENT, PRIMARY KEY(`screenshot_id`),"
                    + " `room_id` INT(11),"
                    + " `key` VARCHAR(512) NOT NULL,"
                    + " `value` VARCHAR(512) NOT NULL,"
                    + " `ts` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                    + ")";
    this._conn.query(this._createQry);
    this._getScreenByIdQry = "SELECT * FROM `screenshots` WHERE `room_id` = ?";
}

Screenshot.prototype.requestScreenshot = function(url, cb) {
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
            this.getScreenshot(room_id, (err, screenshots) => {
                if (err) return cb(err);
                if (screenshots.length > 0)
                    return cb(null, screenshots)
                else {
                    // add job
                    queue.addJob(room_id, url, err => {
                        return cb(err, null);
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


Screenshot.prototype.getScreenshot = function(room_id, cb) {
    this._conn.query(this._getScreenByIdQry, [room_id], (err, res) => {
        if (err) return cb(err);
        return cb(null, res);
    });
}

module.exports = new Screenshot();
