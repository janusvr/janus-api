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
    var keyword = "%" +  (params.keyword || "") + "%";
    var args = [ 
        keyword, keyword, keyword,
        params.offset ? parseInt(params.offset, 10) : 0,
        params.limit ? parseInt(params.limit, 10) : 20,
    ];
    var has_equi = (params.has_equi === "true");
    var query = " SELECT a.url, a.roomtitle, a.meta_description, a.meta_keywords, b.`value` as equi FROM crawl_rooms a "
              + (has_equi ? " INNER " : " LEFT ") + " JOIN screenshots b ON a.url = b.url AND b.key = 'equi' "
              + " WHERE a.janus_enabled = 1 "
              + " AND (a.meta_keywords LIKE ? OR a.meta_description LIKE ? "
              + "       OR a.roomtitle LIKE ? ) "
              + " LIMIT ?, ? ";
    this._conn.query(query, args, (err, res) => {
        return cb(err, res);
    });
};

module.exports = new Room();
