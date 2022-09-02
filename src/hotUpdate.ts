import { Plugins } from '@capacitor/core'
import { File } from '@ionic-native/file';

/**
 * /
 * 规则：web资源包以www_v开头，后面跟的是semver版本号，版本号只能递增
 * 首次：首次加载android_assets
 * 启动：每次启动时检查github最新版本, 如果最新版本跟当前版本号不一致
 *    * 如果没有assets.zip的包那就提示全量更新
 *    * 如果有但是当前版本号与最新版本的major或者minor位不符时仍然执行全量更新
 *    * 有zip包并且只是patch版本号变化则执行hot-update
        * 下载zip包解压到public/www_v，后面加上-latest标志
      另一方面：
      * 扫描public下的资源包，如果发现有-latest包说明需要热更新
      * 将-latest改为-current，将-current（如果有）改为-prev，然后切换webview的base root
   退出：可以执行清理操作，但是保留最新的两个版本，通过对比版本号即可
 */

export function downloadZip () {

}

export function updateAssets() {
  File.listDir(File.externalDataDirectory, 'public').then(res => {
    console.log(res)
  })
  File.writeFile(File.externalDataDirectory, 'public/foo.txt', 'sdfsdfs', {
    replace: true
  })
}

export function changeServerRootPath (version: string) {
  const webView = Plugins.WebView
  return webView.setServerBasePath({
    path: File.externalDataDirectory + 'public/www_v' + version
  }).then(() => {
    return webView.persistServerBasePath()
  })
}

export function currentVersion (version?: string) {
  const key = '__hotUpdate_currentVersion'
  if (version) {
    localStorage.setItem(key, version)
  } else {
    return localStorage.getItem(key)
  }
}

export function getLatestVersion () {
  File.listDir(File.externalDataDirectory, 'public').then(res => {
    const versions = res.map(entry => {
      if (entry.isDirectory && entry.name.startsWith('www_v')) {
        return entry.name.slice(5)
      }
    }).filter(Boolean)

  })
}

class HotUpdate {
  currentVersion: string
  constructor(currentVersion: string) {
    this.currentVersion = currentVersion
  }
  
}

