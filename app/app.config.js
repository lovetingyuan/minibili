// require('dotenv').config()

const pkg = require("./package.json");
const version = pkg.version;
const versionCode = pkg.config.versionCode;
// const [version, versionCode] = pkg.version.split('-')

const dev = process.argv.includes("start");
const gitHash = process.env.EAS_BUILD_GIT_COMMIT_HASH?.substring(0, 7) || "-";

// 三个变体的 applicationId 与应用名都不同，所以能同时装在一台手机上，开发包也不会覆盖正式包。
// 变体由 APP_VARIANT 选择：EAS 里写在 eas.json 的 env，本地构建脚本见 scripts/build-android-local.mjs，
// 不设置时是生产变体。
const VARIANTS = {
  development: { appId: "com.tingyuan.minibili.dev", name: "MiniBili-dev" },
  preview: { appId: "com.tingyuan.minibili.preview", name: "MiniBili-pre" },
  production: { appId: "com.tingyuan.minibili", name: "MiniBili" },
};
const VARIANT_ALIASES = { dev: "development", pre: "preview", prod: "production" };

function resolveVariant() {
  const value = process.env.APP_VARIANT?.trim() || "production";
  const resolved = VARIANT_ALIASES[value] ?? value;

  if (!Object.hasOwn(VARIANTS, resolved)) {
    throw new Error(`未知的 APP_VARIANT：${value}（可选：${Object.keys(VARIANTS).join(" / ")}）`);
  }

  return resolved;
}

const variant = resolveVariant();
const isPreview = variant === "preview";
const { appId, name } = VARIANTS[variant];

const release = `${appId}@${version}+${versionCode}`;

module.exports = {
  name,
  slug: "minibili",
  platforms: ["ios", "android"],
  scheme: "minibili",
  version,
  githubUrl: "https://github.com/lovetingyuan/minibili",
  // 应用默认竖屏由 useAppOrientation 在运行时锁定，播放器全屏时需要能临时解锁旋转
  orientation: "default",
  icon: "./assets/icon/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: appId,
    buildNumber: version,
  },
  android: {
    icon: "./assets/icon/icon.png",
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/icon/android-icon-foreground.png",
      backgroundImage: "./assets/icon/android-icon-background.png",
      monochromeImage: "./assets/icon/android-icon-monochrome.png",
    },
    package: appId,
    permissions: ["WAKE_LOCK"],
    versionCode: Number(versionCode),
  },
  web: {
    output: "single",
    favicon: "./assets/icon/favicon.png",
  },
  plugins: [
    "expo-asset",
    "expo-image",
    "expo-status-bar",
    "expo-secure-store",
    [
      "expo-media-library",
      {
        photosPermission: "允许 MiniBili 访问你的照片。",
        savePhotosPermission: "允许 MiniBili 保存图片到你的相册。",
        granularPermissions: ["photo"],
      },
    ],
    [
      "@preeternal/react-native-cookie-manager",
      {
        androidWebkitVersion: "1.16.0",
      },
    ],
    "expo-font",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#ffffff",
        image: "./assets/icon/splash-icon.png",
        imageWidth: 180,
        resizeMode: "contain",
        dark: {
          image: "./assets/icon/splash-icon-dark.png",
          backgroundColor: "#1c1c1c",
        },
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/icon/android-icon-monochrome.png",
        color: "#fb7299",
      },
    ],
    "./plugins/with-media-notification-icon",
  ],
  experiments: {
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "17ac07b9-df37-4b3a-9a31-50da2bb5d44c",
    },
    buildTime: new Intl.DateTimeFormat("zh", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Shanghai",
    }).format(new Date()),
    gitHash,
    // dsn: process.env.SENTRY_DSN,
    releaseName: release,
  },
  // hooks: {
  //   postPublish: [
  //     {
  //       file: 'sentry-expo/upload-sourcemaps',
  //       config: {
  //         organization: process.env.SENTRY_ORG,
  //         project: process.env.SENTRY_PROJECT,
  //         // authToken: process.env.SENTRY_AUTH_TOKEN,
  //       },
  //     },
  //   ],
  // },
  updates: {
    url: "https://u.expo.dev/17ac07b9-df37-4b3a-9a31-50da2bb5d44c",
    // EAS 的 preview profile 会带上 channel=preview（见 eas.json），本地构建时靠 APP_VARIANT 补齐，
    // 否则 eas update --channel preview 推的 OTA 收不到，About 页的“版本频道”也会是空的
    ...(isPreview ? { requestHeaders: { "expo-channel-name": "preview" } } : {}),
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  owner: "tingyuan",
};

if (dev) {
  delete module.exports.updates;
  delete module.exports.runtimeVersion;
}
