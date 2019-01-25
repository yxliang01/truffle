const assert = require("assert");
const util = require("./util");
const EventEmitter = require("events");

describe.only("Payload Extension", function() {
  let Example;
  // let web3;
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
      const payloadExtension = { a: "hello", b: "world" };
      const instance = await Example.new(payloadExtension, 1);
      assert.deepEqual(instance.payloadExtension, payloadExtension);
    });

    it("fails to deploy with a missing required field", async function() {
      const payloadExtension = { a: "hello", c: "world" };
      try {
        await Example.new(payloadExtension, 1);
      } catch (e) {
        assert.equal(
          e.message,
          "Payload Extension Field 'b' is required and wasn't specified during deployment of contract Example."
        );
        return;
      }
      assert.fail("Deployed when it should have failed due to mising 'b'");
    });

    it("deploys with required and optional fields", async function() {
      const payloadExtension = { a: "hello", b: "world", c: "foo" };
      const instance = await Example.new(payloadExtension, 1);
      assert.deepEqual(instance.payloadExtension, payloadExtension);
    });

    it("deploys with extra field, but filters it out", async function() {
      let payloadExtension = { a: "hello", b: "world", d: "foo" };
      const instance = await Example.new(payloadExtension, 1);
      delete payloadExtension.d;
      assert.deepEqual(instance.payloadExtension, payloadExtension);
    });
  });

  describe("RPC Support", function() {
    let instance;
    // let creationTransaction;
    const ee = new EventEmitter();
    const payloadExtension = { a: "hello", b: "world" };

    const expect = function(method, done) {
      ee.once("transaction", function(data) {
        try {
          assert.equal(data.method, method);
          assert.equal(data.txJsonRpc.a, payloadExtension.a);
          assert.equal(data.txJsonRpc.b, payloadExtension.b);
          done();
        } catch (e) {
          done(e);
        }
      });
    };

    before(async function() {
      instance = await Example.new(payloadExtension, 1);
      // creationTransaction = await web3.eth.getTransaction(
      //   instance.transactionHash
      // );

      // Need to duck punch to report what was received in the JSON RPC payload
      const _queueTransaction = server.provider.manager.state.queueTransaction;
      server.provider.manager.state.queueTransaction = function() {
        ee.emit("transaction", {
          method: arguments[0],
          txJsonRpc: arguments[1]
        });
        return _queueTransaction.apply(
          server.provider.manager.state,
          arguments
        );
      };
    });

    it("supports eth_call", function(done) {
      expect("eth_call", done);
      instance.value.call();
    });

    it("supports eth_estimateGas", function(done) {
      expect("eth_estimateGas", done);
      instance.setValue.estimateGas(1);
    });

    it("supports eth_sendTransaction", function(done) {
      expect("eth_estimateGas", function() {
        expect("eth_sendTransaction", done);
      });
      instance.setValue.sendTransaction(1);
    });
  });

  after(async function() {
    server.close();
  });
});
