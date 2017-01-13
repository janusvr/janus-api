var mysqldb = require('./mysql-db');
function Queue() {
    this._conn = mysqldb.getPool();

    this._createQry = "CREATE TABLE IF NOT EXISTS `jobqueue` ("
                    + " `job_id` INT(11) NOT NULL AUTO_INCREMENT, PRIMARY KEY(`job_id`),"
                    + " `url` VARCHAR(512) NOT NULL,"
                    + " `room_id` INT(11) NOT NULL,"
                    + " `state` VARCHAR(32) DEFAULT 'QUE',"
                    + " `ts` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                    + ")";

    this._addJobQuery = "INSERT INTO `jobqueue` (room_id, url) VALUES (?, ?)";
    this._getJobQuery = "SELECT * FROM `jobqueue` WHERE state = 'QUE' ORDER BY `ts` LIMIT 1 FOR UPDATE";
    this._updateJobQuery = "UPDATE `jobqueue` SET state = ? WHERE job_id = ?";
    this._conn.query(this._createQry, err => { if (err) throw new Error(err); });
}

/**
  * Statuses:
  * QUE (queued)
  * RUN (running)
**/

Queue.prototype.addJob = function (id, url, cb) {
    // add a job to the database   
    this._conn.query(this._addJobQuery, [id,url], (err, res) => {
        if (err) console.log(err); // TODO: error handlers
        if (typeof(cb) == "function")
            cb(err);
    });
};

Queue.prototype.getJob = function (cb) {
    // get (num) jobs from the database, and return them
    // in an array
    // TODO: clean this up, break callbacks into separate functions
    this._conn.getConnection( (err, conn) => {
        conn.beginTransaction( err => {
            if (err) {
                return conn.rollback( () => { throw err });
            }
            conn.query(this._getJobQuery, (err, res) => {
                if (err) {
                    return conn.rollback( () => { throw err });
                }
                if (res.length == 0) {
                    // no jobs, rollback the connection and return an empty array
                    return conn.rollback( () => { return cb(null, []); });
                }
                var results = res;
                var job_id = res[0].job_id;
                conn.query(this._updateJobQuery, ['RUN', job_id], (err) => {
                    if (err) {
                        return conn.rollback( () => { throw err });
                    }
                    conn.commit((err) => {
                        if (err) throw err;
                        conn.release();
                        return cb(null, results);
                    }); 
                });
            }); 
        });
    });
};

Queue.prototype.setJobStatus = function(id, stateString) {
    // set the state on a particular job id
};

module.exports = new Queue();
