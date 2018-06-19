import debugModule from "debug";
const debug = debugModule("debugger:store:development");

import { composeWithDevTools } from "remote-redux-devtools";

import commonConfigure from "./common";

export default function configureStore (reducer, saga, initialState) {
  const composeEnhancers = composeWithDevTools({
    realtime: true,
    actionsBlacklist: [
      "RECEIVE_TRACE", "SCOPE", "DECLARE_VARIABLE",
      "ASSIGN", "SAVE_STEPS", "BEGIN_STEP",
    ],
    stateSanitizer: (state) => ({
      // ast: state.ast,
      session: state.session,
      // evm: state.evm,
      // solidity: state.solidity,
      // data: state.data,
    }),

    name: "truffle-debugger",
    hostname: "localhost",
    port: 11117
  });

  return commonConfigure(reducer, saga, initialState, composeEnhancers);
}
