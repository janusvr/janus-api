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
            return pool;
        }
}
