var redis = require('redis');
var crypto = require('crypto');

module.exports = function(logger, portalConfig, poolConfigs){
    var COOKIE_NAME = '_worker_id';
    var ID_LENGTH = 32;

    var initializeRedis = function(redisConfig) {
        return redis.createClient(redisConfig.port, redisConfig.host)
    }

    var redisClient = initializeRedis(portalConfig.redis);

    var ensureWorkerIdCookie = function(req, res) {
        var cookie = req.cookies[COOKIE_NAME];
        if (cookie === undefined)
        {
            cookie = crypto.randomBytes(ID_LENGTH).toString('hex');
            res.cookie(COOKIE_NAME, cookie, {maxAge: 900000, httpOnly: true, path: '/'});
        }
        return cookie;
    }

    var ensureCORS = function(req, res) {
        var origin = req.get('origin');
        if (origin) {
            res.set({
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': true
            });
        }
    }

    var tryToLock = function(workerId, instanceId, callback) {
        var lua_command = [
            '-- initial lock attempt',
            'if redis.call("set",KEYS[1], ARGV[1], "nx", "ex", ARGV[2])',
            'then',
            '  return true',
            'else',
            '  -- if our, extend expiration',
            '  if redis.call("get",KEYS[1]) == ARGV[1]',
            '  then',
            '    redis.call("expire", KEYS[1], ARGV[2])',
            '    return true',
            '  else',
            '    return false',
            '  end',
            'end'
        ].join("\n")
        var redisKey = 'workers:' + workerId + ':lock';
        var expiration = portalConfig.website.amiAlone.expiration
        redisClient.eval(lua_command, 1, redisKey, instanceId, expiration, callback);
    }

    this.handleRequest = function(req, res, next){
        var instanceId = req.query['instance_id'];
        if (!instanceId) {
            return res.status(400).send(JSON.stringify({
                status: false,
                error: 'instance_id is missing'
            }));
        }

        ensureCORS(req, res);
        var workerId = ensureWorkerIdCookie(req, res);

        tryToLock(workerId, instanceId, function(err, result) {
            res.status(200).send(JSON.stringify({
                status: true,
                error: null,
                answer: !!result
            }));
        });
    };
};
