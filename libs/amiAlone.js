module.exports = function(logger, portalConfig, poolConfigs){
    this.handleRequest = function(req, res, next){
        res.end("Hello World");
    };
};
