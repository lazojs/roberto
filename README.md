[![Build Status](https://travis-ci.org/lazojs/roberto.svg?branch=master)](https://travis-ci.org/lazojs/roberto)

# roberto

> I need to stab someone! Where's my stabbing knife?!

Merges application dependencies configurations.

## Merge Order

1. `app.json` and `conf.json` files found in the module distribution
2. `package.json` meta data

## Example Dependencies

```javascript
// package.json snippets; see usage below for expected results
{
    "name": "app-test1",
    "version": "1.0.0",
    "lazo": "dist"
}

{
    "name": "app-test2",
    "version": "1.0.0",
    "dependencies": {
        "underscore": "1.7.0"
    },
    "lazo": {
        "application": "dist",
        "app": {
            "js": ["app/app2"]
        },
        "conf": {
            "requirejs": {
                "common": {
                    "paths": {
                        "appModule1": "app/module1/index"
                    }
                }
            }
        },
        "dependencies": {
            "underscore": [{
                "install": "common",
                "moduleId": "underscore",
                "conf": {
                    "requirejs": {
                        "common": {
                            "paths": {
                                "underscore": "app/underscore/index"
                            }
                        },
                        "client": {
                            "shim": {
                                "underscore": {
                                    "exports": "_"
                                }
                            }
                        }
                    }
                }
            }]
        }
    }
}
```

## Usage

```javascript
var roberto = require('roberto');

// arguments
// 1. directory to scan
// 2. options
// 3. callback
roberto('test/application/node_modules', {}, function (err, results) {
    // see results below based based on example dependencies
});
```

## Results

```javascript
// see dist dirs in test/application/node_modules for further details
{ app:
   { routes: { '': 'home-cmp', 'login(/)': 'login-cmp' },
     css: [ 'app/skin.css', 'app/app.css' ],
     js: [ 'app/app', 'moduleId1', 'app/app2' ] },
  conf: { requirejs: { common: [Object], client: [Object] } },
  modules:
   [ { dependencies: undefined,
       name: 'app-test1',
       version: '1.0.0',
       data: [Object],
       lazo: 'dist',
       path: '/Users/jstrimp/github.com/jstrimpel/roberto/test/application/node_modules/app-test1',
       versions: undefined,
       conf: [Object] },
     { dependencies: [Object],
       name: 'app-test2',
       version: '1.0.0',
       data: [Object],
       lazo: [Object],
       path: '/Users/jstrimp/github.com/jstrimpel/roberto/test/application/node_modules/app-test2',
       versions: undefined,
       conf: [Object] } ] }
```