import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), cloudflare()],
  environments: {
    client: {
      build: {
        rollupOptions: {
          // /share 由 Worker 用 Hono JSX 直出，这里只剩主站 SPA 这一个静态入口
          input: {
            index: "index.html",
          },
        },
      },
    },
  },
  server: {
    host: true,
    port: 8787,
    strictPort: true,
  },
});
