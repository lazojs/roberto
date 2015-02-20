var gammabot = require('gammabot');
var fabricio = require('fabricio');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var dir = require('node-dir');
var defaults = {
    installSchema: {
        client: path.join('app', 'client'),
        server: path.join('app', 'server'),
        common: 'app'
    },
    distResolver: function (module) {
        if (_.isString(module.lazo)) {
            return path.resolve(path.join(module.path, module.lazo));
        } else {
            if (module.lazo['application']) {
                return path.resolve(path.join(module.path, module.lazo['application']));
            }
        }
    },
    include: /app\.json$|conf\.json$/,
    fileSrcKeyResolver: function (fileName) {
        return /app\.json$/.test(fileName) ? 'app' : 'conf';
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
            lazo: module.data.lazo,
            path: module.path,
            versions: lists.conflicts[module.name]
        };
    });

    return retVal;
}

function mergeArrays(a, b) {
    if (_.isArray(a)) {
        return a.concat(b);
    }
}

function resolveInsallLocation(dependency, moduleName, options) {
    var installPathPrefix = options.installSchema[dependency.install];

    dependency.conf = dependency.conf || {};
    dependency.conf.paths = dependency.conf.paths || {};
    dependency.conf.paths[dependency.moduleId] = installPathPrefix + '/' + moduleName +
        '/' + (dependency.main || dependency.module.data.main);
    dependency.conf.paths[dependency.moduleId] = dependency.conf.paths[dependency.moduleId].substr(0,
        dependency.conf.paths[dependency.moduleId].lastIndexOf('.js'));

    return dependency;
}

module.exports = function (modulesDir, options, callback) {
    var merged = { app: {}, conf: {}, modules: [] };
    var tasks = [];
    options = _.defaults(options || {}, defaults);

    gammabot(path.resolve(modulesDir), _.omit(options, 'include'), function (err, results) {
        if (err) {
            return callback(err, null);
        }

        fabricio(transformData(results), null, function (err, modules) {
            if (err) {
                return callback(err, null);
            }

            modules.forEach(function (module, i) {
                tasks.push(function (callback) {
                    var contents = [];

                    dir.readFiles(options.distResolver(module), mapOptions(options), function (err, content, next) {
                        if (err) {
                            return callback(err, null);
                        }
                        contents.push(content);
                        next();
                    }, function (err, files) {
                        if (err) {
                            return callback(err, null);
                        }

                        files.forEach(function (file, i) {
                            try {
                                var key = options.fileSrcKeyResolver(file);
                                var parsedContents = JSON.parse(contents[i]);
                                merged[key] = _.merge(merged[key] || {}, parsedContents, mergeArrays);
                                modules[i].conf = modules[i].conf || {};
                                modules[i].conf[key] = parsedContents;
                                merged.modules.push(modules[i]);
                                if (modules[i].dependencies) {
                                    for (var k in modules[i].dependencies) {
                                        modules[i].dependencies[k].forEach(function (dependency) {
                                            if (dependency.moduleId) {
                                                dependency = resolveInsallLocation(dependency, k, options);
                                            }
                                            if (dependency.conf) {
                                                merged.conf = _.merge(merged.conf, {
                                                    requirejs: dependency.conf
                                                }, mergeArrays);
                                            }
                                        });
                                    }
                                }
                            } catch (e) {
                                return callback(e, null);
                            }
                        });

                        callback(null, true);
                    });
                });
            });

            async.parallel(tasks, function (err, result) {
                if (err) {
                    return callback(err, null);
                }

                merged.modules = _.uniq(merged.modules, function (module) {
                    return module.name;
                });

                callback(null, merged);
            });
        });
    });
};