var pool = require('../model/mysql-promise-db').getPool();
var bcrypt = require('bcrypt');

/**
 * Get access token.
 */

module.exports.getAccessToken = function(bearerToken) {
//      return {
//        accessToken: token.accessToken,
//        clientId: token.client,
//        expires: token.accessTokenExpiresOn,
//        user: token.user
//      };
    var query = "SELECT * FROM oauth_accessToken WHERE accessToken = ?";
    return pool.query(query, [bearerToken]).then( rows => {
        if (rows.length == 0)
            return;
        return rows[0];
    }).catch(err => {
        console.log(err);
        return;
    }); 
};

/**
 * Get authorization code.
 */

module.exports.getAuthorizationCode = function(authorizationCode) {
//      return {
//          code: code.code,
//          expiresAt: code.expiresAt,
//          clientId: code.clientId,
//          user: code.user
//      }
    var query = "SELECT * FROM oauth_authorizationCode WHERE `code` = ?";
    return pool.query(query, [authorizationCode]).then(rows => {
        if (rows.length === 0)
            return;
        return rows[0];
    }).catch(err => {
        console.log(err);
        return;
    });
};

/**
 * Get client.
 */

module.exports.getClient = function(clientId, clientSecret) {
//      return {
//        clientId: client.clientId,
//        clientSecret: client.clientSecret,
//        grants: client.grants.split(','),
//        userId: client.userId
//      };
    var query = "SELECT * FROM oauth_client WHERE clientId = ? AND clientSecret = ?;"
    return pool.query(query, [clientId, clientSecret]).then(rows => {
        if (rows.length === 0)
            return;
        return rows[0];
    }).catch(err => {
        console.log(err);
        return;
    });
};

/**
 * Get user from client.
 */

module.exports.getUserFromClient = function(client) {
//    return {
//        id: user.id
//    }
    var query = "SELECT user.id FROM user INNER JOIN oauth_client ON oauth_client.userId = user.id WHERE oauth_client.clientId = ?";
    return pool.query(query, [client]).then(rows => {
        if (rows.length === 0)
            return;
        return rows[0];
    }).catch(err => {
        console.log(err);
        return;
    });
};

/**
 * Get refresh token.
 */

module.exports.getRefreshToken = function(bearerToken) {
//      return {
//        clientId: token.clientId,
//        expires: token.refreshTokenExpiresOn,
//        refreshToken: token.accessToken,
//        userId: token.userId
//      };
    var query = "SELECT * FROM refreshToken WHERE refreshToken = ?";
    return pool.query(query, [bearerToken]).then(rows => {
        if (rows.length === 0)
            return;
        return rows[0];
    }).catch(err => {
        console.log(err);
        return;
    });
};

/**
 * Get user.
 */

module.exports.getUser = function(username, password) {
//      return {
//        id: username
//      };
    var query = "SELECT * FROM user WHERE username = ?";
    return pool.query(query, [username]).then(rows => {
        if (rows.length === 0)
            return;
        return rows[0];
    }).then(user => {
        if (!user) return;
       return bcrypt.compare(password, user.password_hash.replace("$2b$", "$2a$")); 
    });

};

/**
 * Save token.
 */

module.exports.saveToken = function(token, client, user) {
//  return bluebird.all([
//    db.hmsetAsync(fmt(formats.token, token.accessToken), data),
//    db.hmsetAsync(fmt(formats.token, token.refreshToken), data)
//  ]).return(data);
};

/**
 * Save authorization code.
 */

module.exports.saveAuthorizationCode = function(code, client, user) {
//    return bluebird.all([
//        db.hmsetAsync(fmt(formats.code, code.authorizationCode), data)
//    ]).return(code);
};

