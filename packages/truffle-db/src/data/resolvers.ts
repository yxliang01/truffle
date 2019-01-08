import { IResolvers } from "graphql-tools";
import { IProject} from "./interface";

export interface IContext {
  Project: IProject;
}

export const resolvers: IResolvers = {
  Query: {
    resolve: (_, { name }, context: IContext ): GQL.IQuery["resolve"] => {
      console.debug("name %s", name);
      console.debug("context %o", context);

      return context.Project.resolve(name);
    }

  }
}
