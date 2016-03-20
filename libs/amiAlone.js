var crypto = require('crypto');

module.exports = function(logger, portalConfig, poolConfigs){
    var COOKIE_NAME = '_worker_id';
    var ID_LENGTH = 32;

    var ensureWorkerIdCookie = function(req, res) {
        var cookie = req.cookies[COOKIE_NAME];
        if (cookie === undefined)
        {
            cookie = crypto.randomBytes(ID_LENGTH).toString('hex');
            res.cookie(COOKIE_NAME, cookie, {maxAge: 900000, httpOnly: true, path: '/'});
        }
        return cookie;
    }

    this.handleRequest = function(req, res, next){
        var cookie = ensureWorkerIdCookie(req, res);
        res.end("Your cookie is " + cookie);
    };
};
