/**
 * Vitest 用的 expo-notifications 替身：只需满足模块加载与常用常量引用。
 */

export const AndroidImportance = {
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
};

export async function setNotificationChannelAsync() {}
export async function getPermissionsAsync() {
  return { status: "denied", granted: false };
}
export async function requestPermissionsAsync() {
  return { status: "denied", granted: false };
}
export async function getExpoPushTokenAsync() {
  return { data: "" };
}
export function addNotificationResponseReceivedListener() {
  return { remove() {} };
}
export function setNotificationHandler() {}
