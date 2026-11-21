import * as Sentry from "@sentry/react-native";
import { registerRootComponent } from "expo";
import "./features/background-updates/task";

import App from "./App";
import { initSentry } from "./config/sentry";
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

initSentry();
registerRootComponent(Sentry.wrap(App));
