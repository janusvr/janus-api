var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    dust = require('express-dustjs');

//global.config = JSON.parse(fs.readFileSync('config.js'));

var roomCatalogue = require('../model/RoomCatalogue');
var Screenshot = require('../model/Screenshot');

function getRoomData(url) {
  catalogue.getRoom(url, (err, rooms) => {
    if (err) return;
    if (rooms.length > 0) {
      var room = rooms[0];
    } else {
      roomCatalogue.addRoom({url: url}, (err, room_id) => {
        // add job
        if (err) return cb(err);
      });
    }
  });
}
var config = {
  webroot: 'https://web.janusvr.com'
}; //JSON.parse(fs.readFileSync('janusweb.conf'));

var app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Use Dustjs as Express view engine
app.engine('dust', dust.engine({
  useHelpers: false
}));
app.set('view engine', 'dust');
app.set('views', path.resolve(__dirname, '../views'));


app.get(/^(?:\/([\d\.]+))?\/sites\/(.*)/, function(req, res) {
  var url = req.url.replace(/^(\/[\d\.]+)?\/sites\//, ''),
      version = req.params[0];
  if (url.match(/^https?:[^\/]/)) {
    url = url.replace(/^(https?):/, '$1://');
  }
  if (url.match(/^https?\//)) {
    url = url.replace(/^(https?)\/+/, '$1://');
  }
  //console.log('got url', url, version, req.url, req.originalUrl);
  roomCatalogue.getRoom(url, (err, rooms) => {
    var tplvars = {
      url: url,
      config: config,
      versionpath: (config.webroot || '') + (version ? '/' + version : ''),
      //room: rooms[0],
      room: {
        roomtitle: 'JanusWeb',
        description: url,
        image: 'http://www.janusvr.com.s3.amazonaws.com/janusweb.png',
      }
    }; 
    if (rooms.length > 0) {
      var room = rooms[0];
      var keys = Object.keys(room);
      keys.forEach((k) => { 
        if (room[k]) {
          tplvars.room[k] = room[k]; 
        }
      });
      if (!room['description']) tplvars.room['description'] = url;
                                
      //console.log('found room info', tplvars.room);
    }

    var shots = Screenshot.requestScreenshot(url, 'thumb', function(err, shots) {
      //console.log('got shots!', shots, err);

      if (!err && shots.length > 0) {
        if (shots[0].value) {
          tplvars.room.image = shots[0].value;
        }
      }

      res.render('janusweb-client', tplvars);
    });
  });
});
app.get('/share', function(req, res) {
  var tplvars = {
    config: config
  };
  res.render('janusweb-share', tplvars);
});

module.exports = app;
