require('dotenv').config()
const pkg = require('./package.json')
const [version, versionCode] = pkg.version.split('-')
// const cp = require('child_process')

const dev = process.argv.includes('start')
const gitHash = process.env.EAS_BUILD_GIT_COMMIT_HASH?.substring(0, 7) || '-'

const appId =
  process.env.APP_VARIANT === 'preview'
    ? 'com.tingyuan.minibili.preview'
    : 'com.tingyuan.minibili'

const name = process.env.APP_VARIANT === 'preview' ? 'MiniBili-pre' : 'MiniBili'

module.exports = {
  name,
  slug: 'minibili',
  version,
  githubUrl: 'https://github.com/lovetingyuan/minibili',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#77e946',
    dark: {
      image: './assets/splash-dark.png',
      resizeMode: 'cover',
      backgroundColor: '#614485',
    },
  },
  assetBundlePatterns: ['assets/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: appId,
    buildNumber: version,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: appId,
    versionCode: Number(versionCode),
  },
  plugins: [
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#ffffff',
        sounds: [],
      },
    ],
    'sentry-expo',
  ],
  extra: {
    eas: {
      projectId: '17ac07b9-df37-4b3a-9a31-50da2bb5d44c',
    },
    buildTime: new Intl.DateTimeFormat('zh', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Shanghai',
    }).format(new Date()),
    gitHash,
  },
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: 'tingyuan123',
          project: 'minibili',
          authToken: process.env.SENTRY_AUTH_TOKEN,
        },
      },
    ],
  },
  updates: {
    url: 'https://u.expo.dev/17ac07b9-df37-4b3a-9a31-50da2bb5d44c',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  owner: 'tingyuan',
}

if (dev) {
  delete module.exports.updates
  delete module.exports.runtimeVersion
}
