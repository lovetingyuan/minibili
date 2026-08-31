import { expect, test } from "vitest";
import { syncUserData } from "./user-data-store";
import { MemoryKvStorage } from "./testing/memory-kv";

test("supports arbitrary future JSON keys and reads the result of delete then set", () => {
  const storage = new MemoryKvStorage();
  syncUserData(storage, { set: { old: true, theme: "dark" } });
  expect(
    syncUserData(storage, {
      delete: ["old", "theme"],
      set: { theme: { mode: "light", options: [null, 42, false] }, newSetting: [] },
      get: ["old", "theme", "newSetting", "missing"],
    }),
  ).toEqual({ theme: { mode: "light", options: [null, 42, false] }, newSetting: [] });
});

test("rolls back both the deletion and preceding writes when a batch fails", () => {
  const storage = new MemoryKvStorage();
  syncUserData(storage, { set: { original: 1 } });
  storage.failOnKey = "broken";
  expect(() =>
    syncUserData(storage, {
      delete: ["original"],
      set: { first: 2, broken: 3 },
    }),
  ).toThrow("storage unavailable");
  expect(syncUserData(storage, { get: ["original", "first", "broken"] })).toEqual({ original: 1 });
});
