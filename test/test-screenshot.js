var screenshot = require('../model/Screenshot'),
    expect = require('chai').expect;

describe('screenshot model', function(done) {
    it('should create a job if a screenshot doesnt exist', function(done) {
        screenshot.requestScreenshot('http://thisdoesnt.exist/', null, function(err, screenshot) {
            if (err) throw err;
            expect(screenshot).to.be.null;
            done();
        });
    });
});
