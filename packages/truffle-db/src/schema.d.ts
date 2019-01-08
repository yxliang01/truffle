// tslint:disable
// graphql typescript definitions

declare namespace GQL {
  interface IGraphQLResponseRoot {
    data?: IQuery;
    errors?: Array<IGraphQLResponseError>;
  }

  interface IGraphQLResponseError {
    /** Required for all errors */
    message: string;
    locations?: Array<IGraphQLResponseErrorLocation>;
    /** 7.2.2 says 'GraphQL servers may provide additional entries to error' */
    [propName: string]: any;
  }

  interface IGraphQLResponseErrorLocation {
    line: number;
    column: number;
  }

  interface IQuery {
    resolve: IContractType | null;
  }

  interface IResolveOnQueryArguments {
    name: string;
  }

  interface IContractType {
    name: string;
    abi: any;
    compilation: ICompilation | null;
    createBytecode: IBytecode | null;
  }

  interface ICompilation {
    compiler: ICompiler;
    contractTypes: IContractTypes;
    sources: ISources;
  }

  interface ICompiler {
    name: string | null;
    version: string | null;
    settings: any | null;
  }

  interface IContractTypes {
    contractTypes: Array<IContractType | null>;
  }

  interface ISources {
    source: ISource | null;
  }

  interface ISourceOnSourcesArguments {
    index: any;
  }

  interface ISource {
    sourcePath: string | null;
    source: string;
    ast: any | null;
  }

  interface IBytecode {
    bytes: any;
    sourceMap: ISourceMap | null;
    linkReferences: Array<ILinkReference | null>;
  }

  interface ISourceMap {
    sourceRange: ISourceRange | null;
    sources: ISources | null;
  }

  interface ISourceRangeOnSourceMapArguments {
    offset: any;
  }

  interface ISourceRange {
    source: ISource;
    start: any;
    length: number;
    meta: ISourceRangeMeta;
  }

  interface ISourceRangeMeta {
    jump: JumpDirection | null;
  }

  const enum JumpDirection {
    IN = 'IN',
    OUT = 'OUT'
  }

  interface ILinkReference {
    offsets: Array<any | null>;
    length: number;
  }

  interface IContractInstance {
    address: any;
    network: INetwork;
    transactionHash: any;
    constructorArgs: Array<any | null>;
    contractType: IContractType;
    callBytecode: IBytecode;
    linkValues: Array<ILinkValue | null>;
  }

  interface INetwork {
    name: string | null;
    networkID: any | null;
  }

  interface ILinkValue {
    linkReference: ILinkReference;
    value: any | null;
  }
}

// tslint:enable
