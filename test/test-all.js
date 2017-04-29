var request = require('superagent'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect,
    Server = require('../server.js'),
    redis = require('redis'),
    redisClient = redis.createClient(global.config.redis);

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
    describe('auth', done => {
        before( done => {
            var db = require('redis').createClient(global.config.redis);
            db.multi()
              .hmset('users:username', {
                id: 'username',
                username: 'username',
                password: 'password'
              })
              .hmset('clients:client', {
                clientId: 'client',
                clientSecret: 'secret',
                grants: "password, authorization_code"
              })
              .exec(function (err) {
                if (err) throw new Error(err); 
                done(); 
              });
        });
        it('should issue a token when provided correct credentials', done => {
            var authString = new Buffer('client:secret').toString('base64');
            request
            .post('http://localhost:8080/oauth/token')
            .send('grant_type=password')
            .send('username=username')
            .send('password=password')
            .set('Authorization', 'Basic '+authString)
            .end( (err, res) => {
                if (err) throw new Error(err);
                expect(res.body).to.contain.all.keys(['access_token', 'token_type', 'expires_in', 'refresh_token']);
                done();
            });
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
            it.skip('should return 200 when /getPopularRooms is requested over https', (done) => {
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
                    if (err) throw new Error(err);
                    var response = res.body;
                    assert.equal(response.success, true);
                    done();
                });
            });
        });
        describe('/get_partylist', done => {
            it('should return partylist from redis', done => {
                var partylist = { 
                    tester: {
                         roomId: '3f2cd15ed94812b8d98bbbe1421478b3',
                         roomUrl: 'http://testroom',
                         roomName: '',
                         client_version: 55.3 
                    } 
                };
                redisClient.set('partylist', JSON.stringify(partylist), (err, reply) => {
                    request
                    .get('http://localhost:8080/get_partylist')
                    .end((err, res) => {
                        if (err) throw new Error(err);
                        expect(res.body).to.eql(partylist);
                        done();
                    });            
                }); 
            });
        });
        describe('/partymodeAPI', done => {
            it ('should return the formatted partylist', done => {
                var partylist = {
                    "success": "true",
                    "data": [
                        {
                            "userId": "tester",
                            "roomId": "3f2cd15ed94812b8d98bbbe1421478b3",
                            "url": "http://testroom",
                            "name": ""
                        }
                    ]
                }
                request
                .get('http://localhost:8080/partymodeAPI')
                .end( (err, res) => {
                    if (err) throw new Error(err);
                    expect(res.body).to.eql(partylist);
                    done();
                });
            });
        });
        describe('/perflog', done => {
            it('should accept POST with perf data', done => {
                data = {
                    "version": "54.0", // decimal: XX.YY
                    "res": [1280, 1024], // int [2]
                    "msaa": "4", // int
                    "fov": "30", // float
                    "url": "http://vesta.janusvr.com/alainchesnais/my-test-room", //varchar(256)
                    "hash": "54bca559366d2b61addd134d6ef70650", // varchar(64)
                    "minftCPU": "0.01", // float
                    "medianftCPU": "0.01",  // float
                    "maxftCPU": "0.01",  // float
                    "minftGPU": "0.01", // float
                    "medianftGPU": "0.01", // float
                    "maxftGPU": "0.01", // float
                    "OS": "Mac OS 10.12.1", // float
                    "sysmem": "8", // float 
                    "processorvendor": "intel", // varchar(256)
                    "processordevice": "2.9 GHz Intel Core i5", // varchar(256)
                    "gpuvendor": "intel", // varchar (256)
                    "gpudevice": "Intel Iris Graphics 6100 1536 MB", // varchar(256)
                    "gpudriverversion": "10.12.1", // varchar(256)
                    "rendermode": "direct" //varchar(256)
                }

                request
                .post("http://localhost:8080/perflog")
                .send("data="+JSON.stringify(data))
                .end((err, res) => {
                    if (err) throw new Error(err);
                    expect(res.body).to.eql({success: true, error: 'success'});
                    done();
                });
            });
        });
    });
});

