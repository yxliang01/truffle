const assert = require("assert");
const util = require("./util");
const EventEmitter = require("events");

describe.only("Payload Extension", function() {
  let Example;
  // let web3;
  let server;
  const port = 12345;
  var providerOptions = { vmErrorsOnRPCResponse: false };
  const ee = new EventEmitter();

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

    // Need to duck punch to report what was received in the JSON RPC payload
    const _queueTransaction = server.provider.manager.state.queueTransaction;
    server.provider.manager.state.queueTransaction = function() {
      ee.emit("transaction", {
        method: arguments[0],
        txJsonRpc: arguments[1]
      });
      return _queueTransaction.apply(server.provider.manager.state, arguments);
    };
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

  describe("Multiple Contracts", function() {
    let instance1 = {
      instance: {},
      payloadExtension: { a: "hello", b: "world" },
      address: "",
      value: 1
    };
    let instance2 = {
      instance: {},
      payloadExtension: { a: "goodbye", b: "universe" },
      address: "",
      value: 2
    };

    const expect = function(method, instance, done) {
      ee.once("transaction", function(data) {
        try {
          assert.equal(data.method, method);
          console.log(data.txJsonRpc.a, instance.payloadExtension.a);
          console.log(data.txJsonRpc.b, instance.payloadExtension.b);
          assert.equal(data.txJsonRpc.a, instance.payloadExtension.a);
          assert.equal(data.txJsonRpc.b, instance.payloadExtension.b);
          assert.equal(
            data.txJsonRpc.to.toLowerCase(),
            instance.address.toLowerCase()
          );
          done();
        } catch (e) {
          done(e);
        }
      });
    };

    it("deploys the first instance", async function() {
      instance1.instance = await Example.new(instance1.payloadExtension, 1);
      instance1.address = instance1.instance.address;
      assert.deepEqual(
        instance1.instance.payloadExtension,
        instance1.payloadExtension
      );
    });

    it("deploys the second instance", async function() {
      instance2.instance = await Example.new(instance2.payloadExtension, 1);
      instance2.address = instance2.instance.address;
      assert.deepEqual(
        instance2.instance.payloadExtension,
        instance2.payloadExtension
      );
      assert.deepEqual(
        instance1.instance.payloadExtension,
        instance1.payloadExtension
      );
      assert.notEqual(instance1.address, instance2.address);
    });

    it("successfully interacts with the first instance", function(done) {
      expect("eth_estimateGas", instance1, function() {
        expect("eth_sendTransaction", instance1, done);
      });
      instance1.instance.setValue.sendTransaction(instance1.value);
    });

    it("successfully interacts with the second instance", function(done) {
      expect("eth_estimateGas", instance2, function() {
        expect("eth_sendTransaction", instance2, done);
      });
      instance2.instance.setValue.sendTransaction(instance2.value);
    });

    it("verifies the two instances have the correct values", async function() {
      const value1 = await instance1.instance.value.call();
      const value2 = await instance2.instance.value.call();

      assert.equal(value1, instance1.value);
      assert.equal(value2, instance2.value);
    });
  });

  after(async function() {
    server.close();
  });
});
