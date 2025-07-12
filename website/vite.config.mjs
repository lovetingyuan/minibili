import { vitePlugin as htmPlugin } from 'unplugin-alpinejs-component'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: './',
  build: {
    outDir: '../docs',
  },
  define: {
    __BUILD_TIME__: JSON.stringify(
      new Intl.DateTimeFormat('zh', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Shanghai',
      }).format(new Date()),
    ),
  },
  plugins: [viteSingleFile(), htmPlugin()],
})
