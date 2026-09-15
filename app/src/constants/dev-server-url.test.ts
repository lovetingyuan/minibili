import { expect, test } from "vitest";

import { DEV_SERVER_PORT, resolveDevServerUrl } from "./dev-server-url";

test(`derives the dev server url on port ${DEV_SERVER_PORT} from the metro host`, () => {
  expect(resolveDevServerUrl("192.168.1.5:8081")).toBe("http://192.168.1.5:8787");
  expect(resolveDevServerUrl("127.0.0.1:8081")).toBe("http://127.0.0.1:8787");
  expect(resolveDevServerUrl("192.168.1.5")).toBe("http://192.168.1.5:8787");
});

test("normalizes localhost to the ipv4 loopback used by adb reverse", () => {
  expect(resolveDevServerUrl("localhost:8081")).toBe("http://127.0.0.1:8787");
});

test("falls back to the ipv4 loopback without a usable host uri", () => {
  expect(resolveDevServerUrl(undefined)).toBe("http://127.0.0.1:8787");
  expect(resolveDevServerUrl(null)).toBe("http://127.0.0.1:8787");
  expect(resolveDevServerUrl("")).toBe("http://127.0.0.1:8787");
  expect(resolveDevServerUrl("   ")).toBe("http://127.0.0.1:8787");
});

test("keeps the tunnel host instead of crashing on it", () => {
  expect(resolveDevServerUrl("abc-def.exp.direct:80")).toBe("http://abc-def.exp.direct:8787");
});
