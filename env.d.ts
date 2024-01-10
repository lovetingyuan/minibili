/// <reference types="@total-typescript/ts-reset/dist/filter-boolean" />
/// <reference types="@total-typescript/ts-reset/dist/fetch" />
/// <reference types="@total-typescript/ts-reset/dist/json-parse" />
/// <reference types="nativewind/types" />

declare var inlineRequire: (f: string) => string

declare module '*.tw.css' {
  const css: any
  export default css
}
