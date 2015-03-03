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
    lists.modules.forEach(function (module, merged) {
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

function mergePackageMetaData(merged, options) {
    merged.modules.forEach(function (module) {
        if (module.lazo.conf) {
            module.conf.conf = _.merge(module.conf.conf, module.lazo.conf, mergeArrays);
            merged.conf = _.merge(merged.conf, module.lazo.conf, mergeArrays);
        }
        if (module.lazo.app) {
            module.conf.app = _.merge(module.conf.app, module.lazo.app, mergeArrays);
            merged.app = _.merge(merged.app, module.lazo.app, mergeArrays);
        }

        if (module.dependencies) {
            for (var k in module.dependencies) {
                module.dependencies[k].forEach(function (dependency) {
                    if (dependency.moduleId) {
                        dependency = resolveInsallLocation(dependency, k, options);
                    }
                    if (dependency.conf) {
                        merged.conf = _.merge(merged.conf, dependency.conf, mergeArrays);
                        module.conf.conf = _.merge(module.conf.conf, dependency.conf, mergeArrays);
                    }
                });
            }
        }
    });
}

function resolveInsallLocation(dependency, moduleName, options) {
    var installPathPrefix = options.installSchema[dependency.install];
    var key = dependency.install;
    var paths;

    dependency.conf = dependency.conf || {};
    dependency.conf.requirejs = dependency.conf.requirejs || {};
    dependency.conf.requirejs[key] = dependency.conf[key] || {};
    dependency.conf.requirejs[key] = dependency.conf.requirejs[key] || {};
    paths = dependency.conf.requirejs[key].paths = dependency.conf.requirejs[key].paths || {};
    paths[dependency.moduleId] = installPathPrefix + '/' + moduleName +
        '/' + (dependency.main || dependency.module.data.main);
    paths[dependency.moduleId] = paths[dependency.moduleId].substr(0,
        paths[dependency.moduleId].lastIndexOf('.js'));

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

                    modules[i].conf = {
                        app: {},
                        conf: {}
                    };

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
                                modules[i].conf[key] = parsedContents;
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

                merged.modules = modules;
                mergePackageMetaData(merged, options);
                callback(null, merged);
            });
        });
    });
};