var fs = require('fs');
var splitca = require('split-ca');

module.exports = {
    webServerPort: 8080,

    MySQL_Hostname: 'localhost',
    MySQL_Username: '',
    MySQL_Password: '',
    MySQL_Database: 'janusvr',  

    /* SSL configurations */
    ssl: {
        port: 8081,
        options: {
            ca: splitca('cert/cabundle.pem'),
            key: fs.readFileSync('cert/server-key.pem'),
            cert: fs.readFileSync('cert/server-cert.pem'),
        }
    },

    apis: {
        popularRooms: {
            enabled: true,
        },
        addThumb: {
            enabled: true,
            masterToken: 'changethis'
        },
        partyList: {
            enabled: false
        }
    }
}

