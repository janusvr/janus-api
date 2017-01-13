function Catalogue () {
    this._conn = require('./mysql-db').getPool();

    this._createQry = "CREATE TABLE IF NOT EXISTS `room_catalogue` ("
                    + " `room_id` INT(11) NOT NULL AUTO_INCREMENT, PRIMARY KEY(`room_id`),"
                    + " `url` VARCHAR(512) NOT NULL,"
                    + " `ts` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,"
                    + " `roomtitle` VARCHAR(512),"
                    + " `firstcrawl` TIMESTAMP,"
                    + " `lastcrawl` TIMESTAMP,"
                    + " `cors_enabled` TINYINT(1),"
                    + " `https` TINYINT(1)"
                    + ")"; 
    this._conn.query(this._createQry);

    this._addQuery = "INSERT IGNORE INTO `room_catalogue` SET ?";
    this._getByUrlQuery = "SELECT * FROM `room_catalogue` WHERE url = ? LIMIT 1";
    this._getByIdQuery = "SELECT * FROM `room_catalogue` WHERE room_id = ? LIMIT 1";

}

Catalogue.prototype.addRoom = function(opts, cb) {
    // opts: {
    //      url: string
    //      roomtitle: string
    //      firstcrawl: timestamp
    //      lastcrawl: timestamp
    //      cors_enabled: bool
    //      https: bool
    // }
    this._conn.query(this._addQuery, opts, (err, res) => {
        if (err) return cb(err);
        return cb(null, res.insertId);
    });
};

Catalogue.prototype.getRoom = function(url, cb) {
    this._conn.query(this._getByUrlQuery, [url], (err, res) => {
        if (err) return cb(err);
        return cb(null, res);
    });
}

module.exports = new Catalogue();
