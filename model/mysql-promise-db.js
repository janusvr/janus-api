var mysql = require('promise-mysql');
if (typeof(global.config) == 'undefined')
    global.config = require('../config.js');

var pool;
// exports.getPool() returns a singleton db pool
module.exports = {
    getPool: function() {
            if (pool) return pool;
            pool = mysql.createPool({
                host     : config.Vesta_Hostname,
                user     : config.Vesta_Username,
                password : config.Vesta_Password,
                database : config.Vesta_Database
            });
            return pool;
        }
}

