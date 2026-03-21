# AGENTS.md

## 项目简介

minibili - 使用 Expo + React Native + TailwindCSS 开发的精简版B站APP。

## 项目结构

本仓库是一个monorepo仓库，基于npm的workspace。

- app，expo主项目，主要采用的框架和库有 expo + typescript + uniwind + swr + rneui组件库 + react-navigation
- server，app项目的服务端，采用 cloudflare + hono 开发。

## 代码规范

### TypeScript

- 遵守严格模式
- 路径别名 `@/*` 映射到 `src/*`
- **[CRITICAL]**使用 `type` 关键字导入类型（如 `import type { Foo } from './types'`）
- **[CRITICAL]**严禁使用 `as any`，严格遵守第三方库的类型定义，严禁杜撰API用法。

### 组件规范

- 使用函数组件，使用function和大驼峰声明。
- 不要使用 `useMemo` `useCallback` `memo`，而是使用 react-compiler。
- 单个组件最好不要超过 300 行。
- 类型定义在单独的 `.ts` 文件中，Zod schema 在 `.schema.ts` 文件
- API 请求使用 `swr` 封装成 hook

### 样式

- 使用 TailwindCSS 语法 + `tw()` 辅助函数，基于 uniwind
- 颜色定义在 `src/constants/colors.tw.ts`
- 尽量不要使用 `style`属性，而是采用 tailwindcss 语法。

### Git

- **[CRITICAL]**严禁自动提交
- **[CRITICAL]**每次任务完毕后必须输出一条遵循 Conventional Commits 规范的commit信息。

### 其他规范

- **[CRITICAL]**你在执行任务的过程中产生的临时文件都只能放在`tmp`文件夹下
