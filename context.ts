import { createContext } from 'react';

export interface UserInfo {
  name: string;
  mid: number | string;
  face: string;
  sign: string;
}

export interface AppContextValue {
  userInfo: UserInfo;
  setUserInfo: (u: UserInfo) => void;
  specialUser: UserInfo;
  setSpecialUser: (u: UserInfo) => void;
  defaultMid: string;
}

export const AppContext = createContext<AppContextValue>(null!);
