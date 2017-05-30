var async = require('async');

function Room() {
    this._conn = require('./mysql-db').getPool();
    this._getRoomByUrlQuery = "SELECT url, roomtitle, meta_description, meta_keywords, num_links FROM crawl_rooms"
                            + " WHERE janus_enabled = 1 AND status_code = 200 AND url = ? LIMIT 1";
    this._getScreenshotsByUrlQuery = "SELECT `key`, `value` FROM screenshots "
                                   + "INNER JOIN crawl_rooms ON crawl_rooms.url = screenshots.url "
                                   + "AND crawl_rooms.janus_enabled = 1 AND crawl_rooms.status_code = 200 "
                                   + "WHERE screenshots.url = ?"; 
}

Room.prototype.get = function(url, cb) {
    async.waterfall([
        (callback) => {
            this._conn.query(this._getScreenshotsByUrlQuery, url, (err, res) => {
                callback(err, res);
            });
        }, 
        (screenshots, callback) => {
            console.log('screen', screenshots);
            this._conn.query(this._getRoomByUrlQuery, url, (err, res) => {
                if (res.length === 0)
                    callback(err, []);
                else {
                    res[0].screenshots = screenshots;
                    callback(err, res);
                }
            });
        }
    ], function (err, results) {
        return cb(err, results);
    });

}


Room.prototype.search = function(params, cb) {
    var args = [ 
        "%" + (params.meta_keywords || "") + "%",
        "%" + (params.meta_description || "") + "%",
        "%" + (params.room_title || "") + "%",
        params.offset ? parseInt(params.offset, 10) : 0,
        params.limit ? parseInt(params.limit, 10) : 20,
    ];
    console.log(args);
    var screenshot = (params.has_screenshot === "true");
    var query = " SELECT a.url, a.roomtitle, a.meta_description, a.meta_keywords, b.`value` as equi FROM crawl_rooms a "
              + " LEFT JOIN screenshots b ON a.url = b.url AND b.key = 'equi' "
              + " WHERE a.janus_enabled = 1 "
              + " AND a.meta_keywords LIKE ? AND a.meta_description LIKE ? "
              + " AND a.roomtitle LIKE ? "
              + " LIMIT ?, ? ";
    console.log(query);
    this._conn.query(query, args, (err, res) => {
        return cb(err, res);
    });
};

module.exports = new Room();
