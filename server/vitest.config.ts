import { defineConfig } from "vitest/config";

// 单独一份配置：vitest 加载 vite.config.ts 时会被 @cloudflare/vite-plugin 拒绝。
export default defineConfig({
  test: {
    include: ["worker/**/*.test.ts", "src/**/*.test.ts"],
  },
});
