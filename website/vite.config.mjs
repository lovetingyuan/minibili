import cp from 'child_process'
import { generate } from 'critical'
import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig((env) => {
  return {
    base: './',
    build: {
      outDir: '../docs',
    },
    plugins: [
      {
        name: 'critical-css',
        enforce: 'post',
        apply: 'build',
        closeBundle() {
          cp.execSync('npx critical index.html --inline --target index.html', {
            cwd: path.resolve(__dirname, '../docs'),
          })
        },
      },
    ],
  }
})
