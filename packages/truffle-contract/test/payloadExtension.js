const assert = require("assert");
const util = require("./util");

describe.only("Payload Extension", function() {
  let Example;
  let web3;
  let server;
  const port = 12345;
  var providerOptions = { vmErrorsOnRPCResponse: false };

  before(async function() {
    this.timeout(20000);

    Example = await util.createExample();
    Example.setPayloadExtensionConfig({
      a: {
        required: true
      },
      b: {
        required: true
      },
      c: {
        required: false
      }
    });

    const result = await util.setUpServer(Example, providerOptions, port);
    web3 = result.web3;
    server = result.server;
  });

  describe("Deployment", function() {
    it("deploys with only required fields", async function() {
      const payloadExtension = {a: "hello", b: "world"};
      const instance = await Example.new(payloadExtension, 1);
      assert.deepEqual(instance.payloadExtension, payloadExtension);
    });

    it("fails to deploy with a missing required field", async function() {
      const payloadExtension = {a: "hello", c: "world"};
      try {
        await Example.new(payloadExtension, 1);
      }
      catch(e) {
        assert.equal(e.message, "Payload Extension Field 'b' is required and wasn't specified during deployment of contract Example.");
        return;
      }
      assert.fail("Deployed when it should have failed due to mising 'b'");
    });

    it("deploys with required and optional fields", async function() {
      const payloadExtension = {a: "hello", b: "world", c: "foo"};
      const instance = await Example.new(payloadExtension, 1);
      assert.deepEqual(instance.payloadExtension, payloadExtension);
    });

    it("deploys with extra field, but filters it out", async function() {
      let payloadExtension = {a: "hello", b: "world", d: "foo"};
      const instance = await Example.new(payloadExtension, 1);
      delete payloadExtension.d;
      assert.deepEqual(instance.payloadExtension, payloadExtension);
    });
  });

  describe("RPC Support", function() {
    let instance;

    before(async function() {
      instance = await Example.new({a: "hello", b: "world"}, 1);
    });

    it("supports eth_call", async function() {
      //
    });
  });

  after(async function() {
    server.close();
  });
});
