import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { fetch } from "expo/fetch";
import { getBilibiliLoginCookie } from "../../api/get-cookie";
import { requestUserData } from "../../api/user-data";
import { bilibiliSession } from "../bilibili-session/session";
import { createUserDataController } from "./controller";

export const userData = createUserDataController({
  read: (key) => AsyncStorage.getItem(key),
  write: (key, value) => AsyncStorage.setItem(key, value),
  isCurrentAccount: bilibiliSession.isCurrentAccount,
  sync: (account, operations, signal) =>
    requestUserData(account, operations, signal, {
      appVersion: Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? null,
      readCookie: getBilibiliLoginCookie,
      isCurrentAccount: bilibiliSession.isCurrentAccount,
      request: fetch,
    }),
});
