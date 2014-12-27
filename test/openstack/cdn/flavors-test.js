/*
 * flavors-test.js: Unit tests for the CDN flavors resource
 *
 * (C) 2014 Rackspace
 *      Shaunak Kashyap
 * MIT LICENSE
 */

var providers = require('../../configs/providers.json'),
    helpers = require('../../helpers'),
    mock = !!process.env.MOCK,
    hock = require('hock'),
    http = require('http'),
    async = require('async'),
    should = require('should'),
    Flavor = require('../../../lib/pkgcloud/openstack/cdn/flavor').Flavor;

// Declaring variables for helper functions defined later
var setupCreateFlavorMock, setupGetFlavorsMock, setupGetFlavorMock,
  setupDeleteFlavorMock;

// Run all unit tests for all providers that support the CDN flavor
providers.filter(function(provider) {
  return !!helpers.pkgcloud.providers[provider].cdn;
}).forEach(function (provider) {

  describe('pkgcloud/openstack/cdn/flavors [' + provider + ']', function() {

    // Create CDN flavor client for provider
    var client = helpers.createClient(provider, 'cdn'),
      context = {},
      authHockInstance, hockInstance,
      authServer, server;

    // Runs before all unit tests are run
    before(function (done) {
  
      if (!mock) {
        return done();
      }
  
      // Spin up an authentication server as well as a CDN flavor server
      hockInstance = hock.createHock({ throwOnUnmatched: false });
      authHockInstance = hock.createHock();
  
      server = http.createServer(hockInstance.handler);
      authServer = http.createServer(authHockInstance.handler);
  
      async.parallel([
        function (next) {
          server.listen(12345, next);
        },
        function (next) {
          authServer.listen(12346, next);
        }
      ], done);
    });

    // Runs after all unit tests have run
    after(function (done) {
      if (!mock) {
        return done();
      }

      async.parallel([
        function (next) {
          server.close(next);
        },
        function (next) {
          authServer.close(next);
        }
      ], done);

    });
  
    // Unit tests follow...
  
    it('the client.createFlavor() method should create a flavor', function(done) {
  
      if (mock) {
        setupCreateFlavorMock(client, provider,  {
          authServer: authHockInstance,
          server: hockInstance
        });
      }
  
      client.createFlavor({
        id: 'cdn',
        providers: [
          {
            provider: 'akamai',
            links: [
              {
                'rel': 'provider_url',
                'href': 'http://www.akamai.com'
              }
            ]
          }
        ]
      }, function (err, flavor) {
        should.not.exist(err);
        should.exist(flavor);

        authHockInstance && authHockInstance.done();
        hockInstance && hockInstance.done();

        done();
      });
    });
  
    it('the client.getFlavors() method should return a list of flavors', function(done) {
  
      if (mock) {
        setupGetFlavorsMock(client, provider,  {
          authServer: authHockInstance,
          server: hockInstance
        });
      }
  
      client.getFlavors(function (err, flavors) {
        should.not.exist(err);
        should.exist(flavors);

        context.flavors = flavors;

        authHockInstance && authHockInstance.done();
        hockInstance && hockInstance.done();

        done();
      });
    });
  
    it('the client.getFlavor() method should return a flavor instance', function(done) {
  
      if (mock) {
        setupGetFlavorMock(client, provider,  {
          authServer: authHockInstance,
          server: hockInstance
        });
      }
  
      client.getFlavor(context.flavors[0], function (err, flavor) {
        should.not.exist(err);
        should.exist(flavor);
        flavor.should.be.an.instanceOf(Flavor);
        flavor.should.have.property('id', context.flavors[0].id);

        context.currentFlavor = flavor;

        authHockInstance && authHockInstance.done();
        hockInstance && hockInstance.done();

        done();
      });
    });
  
    it('the client.getFlavor() method should take a id, return a flavor instance', function(done) {
  
      if (mock) {
        setupGetFlavorMock(client, provider,  {
          authServer: authHockInstance,
          server: hockInstance
        });
      }
  
      client.getFlavor(context.flavors[0].id, function (err, flavor) {
        should.not.exist(err);
        should.exist(flavor);
        flavor.should.be.an.instanceOf(Flavor);
        flavor.should.have.property('id', context.flavors[0].id);

        context.currentFlavor = flavor;

        authHockInstance && authHockInstance.done();
        hockInstance && hockInstance.done();

        done();
      });
    });
    
    it('the client.deleteFlavor() method should delete a flavor', function(done) {
      if (mock) {
        setupDeleteFlavorMock(client, provider,  {
          authServer: authHockInstance,
          server: hockInstance
        });
      }
  
      client.deleteFlavor(context.currentFlavor, function (err) {
        should.not.exist(err);

        authHockInstance && authHockInstance.done();
        hockInstance && hockInstance.done();

        done();
      });
    });
  
    it('the client.deleteFlavor() method should take a id, delete a flavor', function(done) {
      if (mock) {
        setupDeleteFlavorMock(client, provider,  {
          authServer: authHockInstance,
          server: hockInstance
        });
      }
  
      client.deleteFlavor(context.currentFlavor.id, function (err) {
        should.not.exist(err);

        authHockInstance && authHockInstance.done();
        hockInstance && hockInstance.done();

        done();
      });
    });
    
  });
  
});

setupCreateFlavorMock = function (client, provider, servers) {
  if (provider === 'openstack') {
    servers.authServer
      .post('/v2.0/tokens', {
        auth: {
          passwordCredentials: {
            username: 'MOCK-USERNAME',
            password: 'MOCK-PASSWORD'
          }
        }
      })
      .replyWithFile(200, __dirname + '/../../fixtures/openstack/initialToken.json')
      .get('/v2.0/tenants')
      .replyWithFile(200, __dirname + '/../../fixtures/openstack/tenantId.json')
      .post('/v2.0/tokens', {
        auth: {
          passwordCredentials: {
            username: 'MOCK-USERNAME',
            password: 'MOCK-PASSWORD'
          },
          tenantId: '72e90ecb69c44d0296072ea39e537041'
        }
      })
      .reply(200, helpers.getOpenstackAuthResponse());

    servers.server
      .post('/v1.0/72e90ecb69c44d0296072ea39e537041/flavors', {
        id: 'cdn',
        providers: [
          {
            provider: 'akamai',
            links: [
              {
                'rel': 'provider_url',
                'href': 'http://www.akamai.com'
              }
            ]
          }
        ]
      })
      .reply(201, null, { Location: 'http://localhost:12345/v1.0/72e90ecb69c44d0296072ea39e537041/flavors/cdn' })
      .get('/v1.0/72e90ecb69c44d0296072ea39e537041/flavors/cdn')
      .replyWithFile(200, __dirname + '/../../fixtures/openstack/cdnFlavor.json');
  }
};

setupGetFlavorsMock = function (client, provider, servers) {
  if (provider === 'openstack') {
    servers.server
      .get('/v1.0/72e90ecb69c44d0296072ea39e537041/flavors')
      .replyWithFile(200, __dirname + '/../../fixtures/openstack/cdnFlavors.json');
  }
};

setupGetFlavorMock = function (client, provider, servers) {
  if (provider === 'openstack') {
    servers.server
      .get('/v1.0/72e90ecb69c44d0296072ea39e537041/flavors/cdn')
      .replyWithFile(200, __dirname + '/../../fixtures/openstack/cdnFlavor.json');
  }
};

setupDeleteFlavorMock = function (client, provider, servers) {
  if (provider === 'openstack') {
    servers.server
      .delete('/v1.0/72e90ecb69c44d0296072ea39e537041/flavors/cdn')
      .reply(204);
  }
};
