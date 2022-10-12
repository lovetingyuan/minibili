import { createContext } from 'react';

export interface UserInfo {
  name: string;
  mid: number | string;
  face: string;
  sign: string;
}

type WebViewMode = 'PC' | 'MOBILE';

export interface AppContextValue {
  userInfo: UserInfo;
  setUserInfo: (u: UserInfo) => void;
  specialUser: UserInfo;
  setSpecialUser: (u: UserInfo) => void;
  webviewMode: WebViewMode;
  setWebviewMode: (mode: WebViewMode) => void;
  playedVideos: Record<string, boolean>;
  setPlayedVideos: (bvid: string) => void;
  defaultMid: string;
}

export const AppContext = createContext<AppContextValue>(null!);
