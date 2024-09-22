require('dotenv').config()

const pkg = require('./package.json')
const version = pkg.version
const versionCode = pkg.config.versionCode
// const [version, versionCode] = pkg.version.split('-')

const dev = process.argv.includes('start')
const gitHash = process.env.EAS_BUILD_GIT_COMMIT_HASH?.substring(0, 7) || '-'

const appId =
  process.env.APP_VARIANT === 'preview'
    ? 'com.tingyuan.minibili.preview'
    : 'com.tingyuan.minibili'

const release = `${appId}@${version}+${versionCode}`

const name = process.env.APP_VARIANT === 'preview' ? 'MiniBili-pre' : 'MiniBili'

module.exports = {
  name,
  slug: 'minibili',
  version,
  githubUrl: 'https://github.com/lovetingyuan/minibili',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  androidStatusBar: {
    backgroundColor: '#94E0D8',
    barStyle: 'light-content',
    translucent: true,
    hidden: true,
  },
  splash: {
    image: './assets/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['assets/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: appId,
    buildNumber: version,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#ffffff',
      dark: {
        image: './assets/splash-dark.png',
        resizeMode: 'cover',
        backgroundColor: '#000000',
      },
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: appId,
    permissions: ['WAKE_LOCK'],
    versionCode: Number(versionCode),
    splash: {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#ffffff',
      dark: {
        image: './assets/splash-dark.png',
        resizeMode: 'cover',
        backgroundColor: '#000000',
      },
    },
  },
  plugins: [
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        // authToken: process.env.SENTRY_AUTH_TOKEN,
        project: process.env.SENTRY_PROJECT,
        organization: process.env.SENTRY_ORG,
      },
    ],
    'expo-asset',
    // [
    //   'expo-av',
    //   {
    //     microphonePermission:
    //       'Allow $(PRODUCT_NAME) to access your microphone.',
    //   },
    // ],
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
    dsn: process.env.SENTRY_DSN,
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
