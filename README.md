[![Build Status](https://travis-ci.org/lazojs/roberto.svg?branch=master)](https://travis-ci.org/lazojs/roberto)

# roberto

> I need to stab someone! Where's my stabbing knife?!

Merges application dependencies configurations.

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
        "dependencies": {
            "underscore": [{
                "install": "common",
                "moduleId": "underscore",
                "conf": {
                    "shim": {
                        "underscore": {
                            "exports": "_"
                        }
                    },
                    "paths": {
                        "underscore": "app/underscore/index"
                    }
                }
            }]
        }
    }
}
```

## Usage

```javascript
var fabricio = require('fabricio');

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
     js: [ 'app/app.js', 'moduleId1' ] },
  conf: { requirejs: { paths: [Object], shim: [Object] } },
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