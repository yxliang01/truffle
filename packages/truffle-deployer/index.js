const expect = require("truffle-expect");
const Emittery = require("emittery");
const DeferredChain = require("./src/deferredchain");
const Deployment = require("./src/deployment");
const link = require("./src/actions/link");
const create = require("./src/actions/new");

class Deployer extends Deployment {
  constructor(options) {
    options = options || {};
    expect.options(options, ["provider", "network", "network_id"]);

    const emitter = new Emittery();
    super(emitter, options);

    this.emitter = emitter;
    this.chain = new DeferredChain();
    this.logger = options.logger || { log: function() {} };
    this.network = options.network;
    this.network_id = options.network_id;
    this.provider = options.provider;
    this.basePath = options.basePath || process.cwd();
    this.known_contracts = {};
    this.customContractFields = options.customContractFields || {};

    (options.contracts || []).forEach(
      contract => (this.known_contracts[contract.contract_name] = contract)
    );
  }

  // Note: In all code below we overwrite this.chain every time .then() is used
  // in order to ensure proper error processing.
  start() {
    return this.chain.start();
  }

  link(library, destinations) {
    return this.queueOrExec(link(library, destinations, this));
  }

  hasCustomContractFields() {
    return (
      this.customContractFields && typeof this.customContractFields === "object"
    ); /* &&
      Object.keys(this.customContractFields).length > 0;*/
  }

  getCustomContractFields(contract, values) {
    let filteredFields = {};

    if (this.hasCustomContractFields()) {
      const fieldNames = Object.keys(this.customContractFields);
      for (let i = 0; i < fieldNames.length; i++) {
        const fieldName = fieldNames[i];
        const fieldRequired = this.customContractFields[fieldName];

        if (fieldRequired && typeof values[fieldName] === "undefined") {
          throw new Error(
            `Custom Contract Field '${fieldName}' is required and wasn't
            specified during deployment of contract ${contract.contractName}.`
          );
        }

        filteredFields[fieldName] = values[fieldName];
      }
    }

    return filteredFields;
  }

  deploy() {
    const args = Array.prototype.slice.call(arguments);
    const contract = args.shift();

    let customContractFields = {};
    if (this.hasCustomContractFields()) {
      const customContractFieldValues = args.shift();
      customContractFields = this.getCustomContractFields(
        contract,
        customContractFieldValues
      );
    }

    return this.queueOrExec(
      this.executeDeployment(contract, args, customContractFields, this)
    );
  }

  new() {
    const args = Array.prototype.slice.call(arguments);
    const contract = args.shift();

    return this.queueOrExec(create(contract, args, this));
  }

  then(fn) {
    return this.queueOrExec(function() {
      return fn(this);
    });
  }

  queueOrExec(fn) {
    return this.chain.started == true
      ? new Promise(accept => accept()).then(fn)
      : this.chain.then(fn);
  }

  finish() {
    this.emitter.clearListeners();
    this.close();
  }
}

module.exports = Deployer;
