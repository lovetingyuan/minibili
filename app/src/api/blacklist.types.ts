import type { UpInfo } from "../types";

export type BlacklistKey = readonly ["bilibili-blacklist", string, number];
export type BlacklistFetcher = (url: string) => Promise<unknown>;
export type Blacklist = ReadonlyMap<string, UpInfo>;
