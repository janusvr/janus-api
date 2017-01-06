if (typeof(global.config) === "undefined")
    global.config = require('../config.js');

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
  .exec(function (errs) {
    if (errs) {
      console.error(errs[0].message);

      return process.exit(1);
    }

    console.log('Client and user added successfully');
  });
