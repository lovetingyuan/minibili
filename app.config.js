require('dotenv').config()
const pkg = require('./package.json')
const [version, versionCode] = pkg.version.split('-')

module.exports = {
  name: 'MiniBili',
  slug: 'minibili',
  version,
  githubUrl: 'https://github.com/lovetingyuan/minibili',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['assets/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.tingyuan.minibili',
    buildNumber: version,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.tingyuan.minibili',
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
}
