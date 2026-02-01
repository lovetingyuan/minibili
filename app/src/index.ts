import { registerRootComponent } from "expo";

import App from "./App";
import { showFatalError, showToast } from "./utils";

if (typeof ErrorUtils === "object") {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (!isFatal) {
      showToast("抱歉，发生了未知错误 😅");
      return;
    }
    showFatalError(error);
  });
}

registerRootComponent(App);
