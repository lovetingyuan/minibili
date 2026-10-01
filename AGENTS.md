# AGENTS.md

## 项目简介

minibili - 使用 Expo + React Native + TailwindCSS 开发的精简版B站APP。

## 项目结构

本仓库是一个monorepo仓库，基于npm的workspace。

- app，expo主项目，主要采用的框架和库有 expo + typescript + uniwind + swr + react-navigation，基础组件（Button/Skeleton 等）为项目内自维护
- server，app项目的服务端，采用 cloudflare + hono 开发。

## 代码规范

### TypeScript

- 遵守严格模式
- 路径别名 `@/*` 映射到 `src/*`
- **[CRITICAL]** 必须使用 `type` 关键字导入类型
- **[CRITICAL]** 除非是合理使用，否则严禁仅仅为了方便而使用 `as any`，严格遵守第三方库的类型定义，严禁杜撰API用法。
- 公共使用的类型或者通用类型，必须单独在类型文件中定义，并且类型文件严禁引入运行时代码
- 尽量不要使用违反纯粹类型剥离的语法，例如 enum

### 开发规范

- 使用函数组件，使用function和大驼峰声明。
- 不要使用 `useMemo` `useCallback` `memo`，而是使用 react-compiler。
- 单个组件最好不要超过 300 行。
- 类型定义在单独的 `.ts` 文件中，Zod schema 在 `.schema.ts` 文件
- GET类的API请求必须使用 `swr` 封装成 hook

### 样式和设计

- 使用 TailwindCSS 语法 + `tw()` 辅助函数，基于 `uniwind`
- 颜色和主题变量定义在 `src/constants/colors.tw.ts`
- 尽量不要使用 `style` 属性，而是采用 tailwindcss 语法。
- UI界面布局优先紧凑而简洁，尽量不要留有大的空白。
- 文案尽量简洁到位，不要引入有较高理解力成本的文案。

### 其他规范

- **[CRITICAL]** 严禁自动提交，每次任务完毕后必须输出一条遵循 Conventional Commits 规范的commit信息。
- **[CRITICAL]** 你在执行任务的过程中产生的临时文件都只能放在`tmp`文件夹下
- **[CRITICAL]** 除非用户的明确要求，否则不要写测试用例。
