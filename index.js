var gammabot = require('gammabot');
var fabricio = require('fabricio');
var path = require('path');
var _ = require('lodash');
var defaults = {
    distResolver: function (lazoMetaData) {

    },
    include: /app\.json$||conf\.json$/,
    fileSrcKeyResolver: function (fileName) {
        return fileName.find(/app\.json$/) ? 'app' : 'conf';
    }
};

function mapOptions(options) {
    return {
        match: options.include,
        matchDir: options.includeDir,
        exclude: options.exclude,
        excludeDir: options.excludeDir
    };
}

function transformData(lists) {
    var retVal = {};
    lists.modules.forEach(function (module) {
        retVal[module.name] = {
            version: module.version,
            data: module.data,
            path: module.path,
            versions: lists.conflicts[module.name]
        };
    });

    return retVal;
}

module.exports = function (appSrc, modulesDir, options, callback) {
    var merged = { app: {}, conf: {}, modules: [] };
    var tasks = [];
    options = _.defaults(options || {}, defaults);

    gammabot(modulesDir, options, function (err, results) {
        if (err) {
            return callback(err, null);
        }

        fabricio(transformData(results), null, function (err, modules) {
            if (err) {
                return callback(err, null);
            }

            modules.forEach(function (module) {
                tasks.push(function (callback) {
                    var contents = [];
                    dir.readFiles(options.distResolver(module.lazo), mapOptions(options), function (err, content, next) {
                        if (err) {
                            return callback(err, null);
                        }
                        contents.push(content);
                        next();
                    }, function (err, files) {
                        if (err) {
                            return callback(err, null);
                        }

                        files.forEach(function (file) {
                            var key = options.fileSrcKeyResolver(file);
                            merged[key] = _.merge(merged[key] || {}, file);
                            module.conf = module.conf || {};
                            module.conf[key] = file;
                        });

                        callback(null, true);
                    });
                });
            });

            async.parallel(tasks, function (err, result) {
                if (err) {
                    return callback(err, null);
                }

                callback(null, modules);
            });
        });
    });
};