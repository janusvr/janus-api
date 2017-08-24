var mysql = require('mysql');
if (typeof(global.config) == 'undefined')
    global.config = require('../config.js');

var pool;
// exports.getPool() returns a singleton db pool
    


module.exports = {
    getPool: function() {
            if (pool) return pool;
            pool = mysql.createPool({
                host     : config.MySQL_Hostname,
                user     : config.MySQL_Username,
                password : config.MySQL_Password,
                database : config.MySQL_Database
            });
            (function () {
              var _getConnection = pool.getConnection;
              pool.getConnection = function (cb) {
                var trace = new Error('connection not released after 20 seconds');
                var timer = setTimeout(function () {
                  console.log(trace);
                }, 20000);
                _getConnection.call(this, function (err, conn) {
                  if (err) return cb(err);
                  var _release = conn.release;
                  conn.release = function () {
                    clearTimeout(timer);
                    conn.release = _release;
                    conn.release();
                  };
                  cb(null, conn);
                });
              };
            })();
            return pool;
        }
}
