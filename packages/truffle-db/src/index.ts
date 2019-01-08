import fs from "fs";
import path from "path";

import { makeExecutableSchema, IResolvers } from "graphql-tools";
import { graphql } from "graphql";
import { resolvers } from "truffle-db/data/resolvers";
import { IProject } from "truffle-db/data/interface";

import AbstractionAdapter from "truffle-db/adapter";

interface ITruffleResolver {
  require(name: string): any
}

class Project implements IProject {
  artifacts: ITruffleResolver;
  adapter: AbstractionAdapter;

  constructor (artifacts: ITruffleResolver) {
    this.artifacts = artifacts;
    this.adapter = new AbstractionAdapter();
  }

  resolve (name: string) {
    return this.adapter.read(this.artifacts.require(name));
  }
}

export default class TruffleDB {
  schema: any;

  constructor (artifacts: ITruffleResolver) {
    const adapter = new AbstractionAdapter();

    const schemaFile = path.join(__dirname, "..", "schema", "contract.graphql");
    const typeDefs = fs.readFileSync(schemaFile).toString();
    const connectors = {
      Project: () => (new Project(artifacts)
    };

    this.schema = makeExecutableSchema({ typeDefs, resolvers, connectors });
  }

  async query (query: string): Promise<any> {
    return await graphql(this.schema, query);
  }
}
