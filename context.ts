import { createContext } from 'react';

export interface SpecialUser {
  name: string;
  mid: string;
  face: string;
}

export interface AppContextValue {
  userId: string;
  setUserId: (m: string) => void;
  specialUser: SpecialUser | null;
  setSpecialUser: (u: SpecialUser) => void;
  defaultMid: string;
}

export const AppContext = createContext<AppContextValue>(null!);
