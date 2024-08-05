// import cp from 'child_process'
// import { generate } from 'critical'
// import fs from 'fs'
// import path from 'path'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

import htmPlugin from './viteHtmPlugin'

export default defineConfig((env) => {
  return {
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
    plugins: [
      viteSingleFile(),
      // {
      //   name: 'critical-css',
      //   enforce: 'post',
      //   apply: 'build',
      //   closeBundle() {
      //     cp.execSync('npx critical index.html --inline --target index.html', {
      //       cwd: path.resolve(__dirname, '../docs'),
      //     })
      //   },
      // },
      htmPlugin(),
    ],
  }
})
