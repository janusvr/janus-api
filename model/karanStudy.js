

function karanStudy() {
    this._conn = require('./mysql-db.js').getPool(); 

    var createTableQry = "CREATE TABLE IF NOT EXISTS `karanStudy` "
                         + "(id INTEGER PRIMARY KEY NOT NULL AUTO_INCREMENT, studyResponse TEXT NOT NULL)";  
    this._conn.query(createTableQry);
}

karanStudy.prototype.post = function(str, cb) {
    this._conn.query("INSERT INTO `karanStudy` (studyResponse) VALUES (?)", [str], (err, rows) => {
        return cb(err, rows);
    }); 
    
}

karanStudy.prototype.get = function(cb) {
    this._conn.query("SELECT studyResponse FROM karanStudy", (err, rows) => {
        return cb(err, rows);
    });
}

module.exports = new karanStudy();
