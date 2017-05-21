var mysqldb = require('./mysql-db');
function Queue() {
    this._conn = mysqldb.getPool();

    this._createQry = "CREATE TABLE IF NOT EXISTS `jobqueue` ("
                    + " `job_id` INT(11) NOT NULL AUTO_INCREMENT, PRIMARY KEY(`job_id`),"
                    + " `url` VARCHAR(512) NOT NULL,"
                    + " `room_id` INT(11) NOT NULL,"
                    + " `type` VARCHAR(128) DEFAULT 'thumb',"
                    + " `base_filename` VARCHAR(255),"
                    + " `state` VARCHAR(32) DEFAULT 'QUE',"
                    + " `ts` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                    + ")";
    this._dropTrigger = "DROP TRIGGER IF EXISTS before_insert_job ";
    this._createTrigger = "CREATE TRIGGER before_insert_job "
                        + "BEFORE INSERT ON `jobqueue` "
                       + " FOR EACH ROW SET new.base_filename = CONCAT(MD5(new.url), '/', new.type, '/', UNIX_TIMESTAMP(CURRENT_TIMESTAMP), '.jpg')"
 
    this._addJobQuery = "INSERT INTO `jobqueue` (room_id, url) VALUES (?, ?)";
    this._getJobQuery = "SELECT * FROM `jobqueue` WHERE state = 'QUE' ORDER BY `ts` LIMIT 1 FOR UPDATE";
    this._updateJobQuery = "UPDATE `jobqueue` SET state = ? WHERE job_id = ?";
    this._finishJob = "DELETE from `jobqueue` WHERE job_id = ?";
    this._getJobById = "SELECT * FROM `jobqueue` WHERE job_id = ?";
    this._conn.query(this._createQry, err => { 
        if (err) throw new Error(err); 
        this._conn.query(this._dropTrigger, err => {
            this._conn.query(this._createTrigger, err => {if (err) throw new Error(err); });
        });
    });
    this._checkJobQueryById = "SELECT * FROM `jobqueue` WHERE `job_id` = ?";
    this._checkJobQueryByUrl = "SELECT * FROM `jobqueue` WHERE `url` = ?";
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
        if (typeof(cb) == "function") {
            this._conn.query(this._getJobById, [res.insertId], (err, job) => {
                if (err) return cb(err);
                return cb(null, job);
            });
        }
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

Queue.prototype.checkJob = function(opts, cb) {
    var byJobId = typeof opts.job_id !== "undefined";
    var query = byJobId ? this._checkJobQueryById : this._checkJobQueryByUrl;
    var args = byJobId ? opts.job_id : opts.url;

    this._conn.query(query, [args], (err, res) => {
        return cb(err, res);
    });
};

Queue.prototype.finishJob = function(job_id, cb) {
    this._conn.query(this._finishJob, [job_id], (err, res) => {
        if (err) return cb(err);
        return cb(null, res);
    });
};

module.exports = new Queue();
