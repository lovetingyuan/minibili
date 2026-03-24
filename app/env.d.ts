/// <reference types="uniwind/types" />
/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SERVER_URL?: string
  }
}
