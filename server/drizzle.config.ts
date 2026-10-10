import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./worker/db/schema.ts",
  out: "./drizzle",
});
