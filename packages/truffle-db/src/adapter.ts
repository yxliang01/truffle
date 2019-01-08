import { ContractObject } from "truffle-contract-schema/spec";

export default class AbstractionAdapter {

  read(abstraction: ContractObject): GQL.IContractType {
    return {
      name: abstraction.contractName || "Contract",
      abi: abstraction.abi,
      compilation: null,
      createBytecode: (abstraction.bytecode) ? {
        bytes: this.readBytes(abstraction.bytecode),
        sourceMap: null,
        linkReferences: []
      } : null
    }
  }

  readBytes(bytecode: string): Uint8Array {
    return new Uint8Array(
      (bytecode
        .match(/.{1,2}/g) || [])
        .map(byte => parseInt(byte, 16))
    );
  }


}
