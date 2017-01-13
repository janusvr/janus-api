global.config = require('../config');
var queue = require('../model/Queue');

describe('Queue', function() {
    it('should add a job', function(done) {
        queue.addJob(13, 'http://someurl', done);
    }); 
    it('should get a job', function(done) {
        queue.getJob(function(err, job) {
            if (err) throw new Error(err);
            console.log(job);
            done();
        });

    });
});
