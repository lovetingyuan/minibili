import type { Context, Hono } from "hono";

export type ServerBindings = Cloudflare.Env;
export type AppType = Hono<{ Bindings: ServerBindings }>;
export type AppContext = Context<{ Bindings: ServerBindings }>;
