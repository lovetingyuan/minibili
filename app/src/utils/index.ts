import * as Application from "expo-application";
import * as Updates from "expo-updates";
import { Alert, Linking, Share } from "react-native";
import Toast from "react-native-simple-toast";
import { throttle } from "throttle-debounce";

import { fetchVersion } from "@/api/check-update";
import { site } from "@/constants";

import { buildVideoShareMessage, buildVideoShareUrl } from "./share";

export {
  getImagePixelDimensions,
  getImagePixelSize,
  getOriginalImgUrl,
  parseImgUrl,
  parseUrl,
} from "./image";
export { stripEmTags } from "./html";
export { resolveNetworkUsage } from "./network";

export const parseNumber = (num?: number | null) => {
  if (num == null) {
    return "";
  }
  if (num < 10000) {
    return `${num}`;
  }
  return `${(num / 10000).toFixed(1)}万`;
};

export const parseDate = (time?: number | string, more?: boolean) => {
  if (!time) {
    return "";
  }
  if (typeof time === "string") {
    if (/^\d+$/.test(time)) {
      time = +time;
    } else {
      return time;
    }
  }
  if (time.toString().length === 10) {
    time = time * 1000;
  }
  const date = new Date(time);
  const currentYear = new Date().getFullYear();
  let year = date.getFullYear();
  if (year === currentYear) {
    year = 0;
  }
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const ret = `${year ? `${year}-` : ""}${month}-${day}`;
  if (more) {
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    return `${ret} ${hour}:${minute}`;
  }
  return ret;
};

export const parseDuration = (seconds?: number | string) => {
  if (!seconds) {
    return "";
  }
  if (typeof seconds === "string") {
    return seconds;
  }
  const hour = Math.floor(seconds / 3600);
  const minute = Math.floor((seconds - hour * 3600) / 60);
  const second = seconds - hour * 3600 - minute * 60;

  const hourString = hour < 10 ? `0${hour}` : hour;
  const minuteString = minute < 10 ? `0${minute}` : minute;
  const secondString = second < 10 ? `0${second}` : second;
  return `${(hourString === "00" ? "" : `${hourString}:`) + minuteString}:${secondString}`;
};

export function parseDurationStr(duration: string) {
  return duration
    .split(":")
    .map((t) => {
      if (t.length === 1) {
        return `0${t}`;
      }
      return t;
    })
    .join(":");
}

export async function handleShareVideo(
  name: string,
  title: string,
  bvid: string | number,
  p = 1,
) {
  try {
    await Share.share({
      message: buildVideoShareMessage(name, title, buildVideoShareUrl(bvid, p)),
    });
  } catch {
    showToast("分享失败");
  }
}

export async function handleShareUp(name: string, mid: number | string, sign: string) {
  try {
    const message = sign.length < 40 ? sign : `${sign.substring(0, 40)}……`;
    await Share.share({
      // title: 'MiniBili - ' + video.owner.name,
      message: [`MiniBili - ${name}`, message, `https://m.bilibili.com/space/${mid}`].join("\n"),
    });
  } catch {
    showToast("分享失败");
  }
}

export async function handleShareDynamic(title: string, url: string) {
  try {
    const message = Array.from(title).slice(0, 40).join("");
    await Share.share({
      message: [message, url].filter(Boolean).join("\n"),
    });
  } catch {
    showToast("分享失败");
  }
}

const toastFuncMap: Record<string, () => void> = {};
export function showToast(message: string, long = false) {
  if (!(message in toastFuncMap)) {
    toastFuncMap[message] = throttle(
      5000,
      () => {
        Toast.show(message, long ? Toast.LONG : Toast.SHORT);
        // Platform.OS === 'android'
        //   ? ToastAndroid.show(
        //       message,
        //       long ? ToastAndroid.LONG : ToastAndroid.SHORT,
        //     )
        //   : Toast.show(message, {
        //       duration: long ? Toast.durations.LONG : Toast.durations.SHORT,
        //     })
      },
      {
        noLeading: false,
      },
    );
  }
  toastFuncMap[message]();
}

let showedFatalError = false;

export async function showFatalError(error: any) {
  if (showedFatalError) {
    return;
  }
  const updateInfo = await fetchVersion().catch(() => null);
  showedFatalError = true;
  // if (__DEV__) {
  //   return
  // }
  const hasUpdate =
    updateInfo?.[0] && updateInfo[0].version !== Application.nativeApplicationVersion;

  Alert.alert(
    "抱歉，应用发生了错误😅",
    `我们会处理这个错误\n${error?.message || error}${
      hasUpdate ? "\n您当前使用的是旧版应用，推荐您下载新版应用来避免错误" : ""
    }`,
    [
      hasUpdate
        ? {
            text: "下载新版",
            onPress: () => {
              Linking.openURL(site);
            },
          }
        : null,
      {
        text: "确定",
        onPress() {
          Updates.reloadAsync();
        },
      },
    ].filter((v) => v !== null),
    {
      cancelable: false,
      onDismiss() {
        showedFatalError = false;
      },
    },
  );
}

// export function openUrl(url: string) {
//   Linking.openURL(url)
// }

export function isDefined(v: any) {
  return v !== null && v !== undefined;
}
