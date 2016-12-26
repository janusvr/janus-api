var fs = require('fs');
var splitca = require('split-ca');

module.exports = {
    webServerPort: 8080,

    /* MySQL config */
    MySQL_Hostname: 'localhost',
    MySQL_Username: 'root',
    MySQL_Password: '',
    MySQL_Database: 'janusvr',  
    
    /* Redis config */
    redis: {
        host: "127.0.0.1",
        port: 6379,
        //password: null
    },

    /* SSL config */
    ssl: {
        port: 8081,
        options: {
            ca: splitca('cert/cabundle.pem'),
            key: fs.readFileSync('cert/server-key.pem'),
            cert: fs.readFileSync('cert/server-cert.pem'),
        }
    },

    /* API Config */
    apis: {
        popularRooms: {
            enabled: true,
        },
        addThumb: {
            enabled: true,
            masterToken: 'changethis'
        },
        partyList: {
            enabled: true,
        },
        perfLog: {
            enabled: true,
            db: "perflogs"  
        }
    }
}

