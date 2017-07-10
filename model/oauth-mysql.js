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
    var query = "SELECT * FROM oauth_client WHERE clientId = ? AND clientSecret = ?;";
    var grantsQuery = "SELECT grants.description FROM oauth_client client INNER JOIN oauth_userClientGrants ucg ON ucg.clientId = client.clientId INNER JOIN oauth_grants grants on grants.id = ucg.grantId WHERE client.clientId = ? AND client.clientSecret = ?;";
    return pool.query(query, [clientId, clientSecret]).then(rows => {
        if (rows.length === 0)
            return;
        return pool.query(grantsQuery, [clientId, clientSecret]).then(grantRows => {
            let retVal = rows[0];
            retVal.grants = grantRows.map(a => a.description);
            return retVal;
        });
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
    var query = "SELECT user.id FROM user INNER JOIN oauth_client ON oauth_client.user = user.id WHERE oauth_client.clientId = ? AND oauth_client.clientSecret = ?";
    return pool.query(query, [client.clientId, client.clientSecret]).then(rows => {
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
//  var data = {
//    accessToken: token.accessToken,
//    accessTokenExpiresAt: token.accessTokenExpiresAt,
//    client: client.clientId,
//    user: user.id
//  };
//  return bluebird.all([
//    db.hmsetAsync(fmt(formats.token, token.accessToken), data),
//    db.hmsetAsync(fmt(formats.token, token.refreshToken), data)
//  ]).return(data);
    console.log(`Save token, ${JSON.stringify(token, null, 4)}`);
    var setAccessToken = "INSERT INTO oauth_accessToken (accessToken, clientId, expires, user, scope) VALUES (?, ?, ?, ?, ?)",
        setRefreshToken = "INSERT INTO oauth_refreshToken (clientId, expires, refreshToken) VALUES (?, ?, ?)";
    return pool.query(setAccessToken, [token.accessToken, client.clientId, token.accessTokenExpiresAt, user.id, token.scope])
    .then(rows => {
        return {
            accessToken: token.accessToken,
            accessTokenExpiresAt: token.accessTokenExpiresAt,
            client: client.clientId,
            user: user.id
        }
    });
};

/**
 * Save authorization code.
 */

module.exports.saveAuthorizationCode = function(code, client, user) {
//    return bluebird.all([
//        db.hmsetAsync(fmt(formats.code, code.authorizationCode), data)
//    ]).return(code);
    var query = "INSERT INTO oauth_authorizationCode (`code`, expiresAt, ClientId, user) VALUES (?, ?, ?, ?)";
    console.log(`saveAuthorizationCode()code: ${code}, client: ${client}, user: ${user}`);
};

module.exports.validateScope = function(user, client, scope) {
// Returns validated scopes to be used or a falsy value to reject
    var query = "SELECT * FROM oauth_scope WHERE userId = ? AND clientId = ?";
    return pool.query(query, [user.id, client.clientId]).then(rows => {
        console.log('scope returned', rows);
        if (rows.length === 0)
            return false;
        let allowed = new Set(rows.map(x => x.scope));
        let supplied = scope.split(" ");
        let validated = supplied.filter(x => allowed.has(x));
        if (validated.length === 0)
            return false;
        return validated.join(" ");
    }).catch(err => {
        console.log(err);
        return;
    });
}

module.exports.verifyScope = function(token, scope) {
// Returns true if the access token passes, false otherwise.
    var query = "SELECT * FROM oauth_accessToken WHERE accessToken = ? AND scope = ?;";
    return pool.query(query, [token.accessToken, scope]).then(rows => {
        if (rows.length === 0)
            return false;
        return true;
    }).catch(err => {
        console.log(err);
        return;
    }); 
}
