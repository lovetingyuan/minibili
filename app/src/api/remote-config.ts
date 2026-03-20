import React from "react";
import type { z } from "zod";

import { configUrl } from "../constants";
import type { ConfigSchema } from "./remote-config.schema";

type RemoteConfig = z.infer<typeof ConfigSchema>;

export function getRemoteConfig() {
  return fetch(`${configUrl}?_t=${Date.now()}`)
    .then((r) => r.json())
    .then((res: RemoteConfig) => {
      return res;
    });
}

export const useRemoteConfig = () => {
  const [config, setConfig] = React.useState<RemoteConfig | null>(null);
  React.useEffect(() => {
    if (config) {
      return;
    }
    getRemoteConfig().then(setConfig);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return config;
};
