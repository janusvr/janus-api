var request = require('superagent'),
    assert = require('chai').assert,
    Server = require('../server.js');


describe('server', () => {
    var app;
    before( (done) => {
        app = new Server();
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0; // turn off ssl cert validation
        app.start(done);
    });

    after( (done) => {
        //process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 1;
        app.close( () => {
            app = null;
            process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 1; // turn on ssl cert validation
            done();
        });
    });
    describe('apis', (done) => {
        describe('/getPopularRooms', (done) => {
            it('should return 200 when /getPopularRooms is requested over http', (done) => {
                request
                .get('http://localhost:8080/getPopularRooms')
                .end(function(err, res) {
                    if (err) return done(err);
                    assert.equal(res.status, 200);
                    done(); 
                });
            });
            it('should return 200 when /getPopularRooms is requested over https', (done) => {
                request
                .get('https://localhost:8081/getPopularRooms')
                .end( (err, res) => {
                    if (err) return done(err);
                    assert.equal(res.status, 200);
                    done();
                });
            });
        });
        describe('/addThumb', done => {
            it('should return 200 when POSTing to /addThumb', (done) => {
                var data = {
                    roomUrl: "http://testroom",
                    thumbnail: "http://thumbnail",
                    token: "changethis"
                }
                request
                .post('http://localhost:8080/addThumb')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(data))
                .end((err, res) => {
                    if (err) console.log(err);
                    var response = res.body;
                    assert.equal(response.success, true);
                    done();
                });
            });
        });
    });
});

