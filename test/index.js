var roberto = require('../index');
var chai = require('chai');
var _ = require('lodash');
var path = require('path');

describe('roberto', function () {

    it('should merge application dependencies configurations', function (done) {

        roberto('test/application/node_modules', { excludeDir: null }, function (err, results) {
            if (err) {
                throw err;
            }

            chai.expect(_.size(results.app.routes)).to.be.equal(2);
            chai.expect(results.app.css.length).to.be.equal(2);
            chai.expect(results.app.js.length).to.be.equal(2);
            chai.expect(_.size(results.conf.requirejs.paths)).to.be.equal(2);
            chai.expect(results.conf.requirejs.shim.underscore).to.be.Object;
            chai.expect(results.modules.length).to.be.equal(2);
            done();
        });

    });

});







