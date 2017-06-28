/**
 * Module dependencies.
 */

var redis = require('redis'), bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
var db = redis.createClient(global.config.redis);
var fmt = require('util').format;

/**
 * Redis formats.
 */

var formats = {
  client: 'clients:%s',
  token: 'tokens:%s',
  user: 'users:%s',
  code: 'codes:%s'
};

/**
 * Get access token.
 */

module.exports.getAccessToken = function(bearerToken) {
  return db.hgetallAsync(fmt(formats.token, bearerToken))
    .then(function(token) {
      if (!token) {
        return;
      }
      return {
        accessToken: token.accessToken,
        clientId: token.client,
        expires: token.accessTokenExpiresOn,
        user: token.user
      };
    });
};

/**
 * Get authorization code.
 */

module.exports.getAuthorizationCode = function(authorizationCode) {
    return db.hgetallAsync(fmt(formats.code, authorizationCode.code))
        .then(function(code) {
            if (!code) 
                return;
            return {
                code: code.code,
                expiresAt: code.expiresAt,
                clientId: code.clientId,
                user: code.user
            }
        });
};

/**
 * Get client.
 */

module.exports.getClient = function(clientId, clientSecret) {
  return db.hgetallAsync(fmt(formats.client, clientId))
    .then(function(client) {
      if (!client || client.clientSecret !== clientSecret) {
        return;
      }
      return {
        clientId: client.clientId,
        clientSecret: client.clientSecret,
        grants: client.grants.split(','),
        userId: client.userId
      };
    });
};

/**
 * Get user from client.
 */

module.exports.getUserFromClient = function(client) {
    return db.hgetallAsync(fmt(formats.user, client.userId))
       .then(function(user) {
            if (!client)
                return false;
            return {
                id: user.id
            }
        });
};

/**
 * Get refresh token.
 */

module.exports.getRefreshToken = function(bearerToken) {
  return db.hgetallAsync(fmt(formats.token, bearerToken))
    .then(function(token) {
      if (!token) {
        return;
      }

      return {
        clientId: token.clientId,
        expires: token.refreshTokenExpiresOn,
        refreshToken: token.accessToken,
        userId: token.userId
      };
    });
};

/**
 * Get user.
 */

module.exports.getUser = function(username, password) {
  return db.hgetallAsync(fmt(formats.user, username))
    .then(function(user) {
      if (!user || password !== user.password) {
        return;
      }

      return {
        id: username
      };
    });
};

/**
 * Save token.
 */

module.exports.saveToken = function(token, client, user) {
  var data = {
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    client: client.clientId,
    //refreshToken: token.refreshToken,
    //refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    user: user.id
  };
  return bluebird.all([
    db.hmsetAsync(fmt(formats.token, token.accessToken), data),
    db.hmsetAsync(fmt(formats.token, token.refreshToken), data)
  ]).return(data);
};

/**
 * Save authorization code.
 */

module.exports.saveAuthorizationCode = function(code, client, user) {
    var data = {
        expires: code.expiresAt,
        client: client.clientId,
        code: code.authorizationCode,
        user: user.id
    }
    return bluebird.all([
        db.hmsetAsync(fmt(formats.code, code.authorizationCode), data)
    ]).return(code);
};
