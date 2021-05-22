import { createApp } from 'vue'
import App from './App.vue'
import CrossImage from './components/CrossImage.vue'
import Loading from './components/Loading.vue'
import 'normalize.css'
import './index.css'
import store from './store'
import { Plugins } from '@capacitor/core'
import { getLatestRelease } from './request'

Plugins.Storage.get({
  key: 'checkUpdateTime'
}).then(val => {
  if (val.value && (Date.now() - (Number(val.value)) > 48 * 60 * 60 * 1000)) {
    getLatestRelease().then(() => {
      Plugins.Storage.set({
        key: 'checkUpdateTime', value: Date.now() + ''
      })
      if (store.latestVersion && store.latestVersion !== store.version && store.downloadUrl) {
        Plugins.Modals.confirm({
          title: '更新',
          message: `当前版本${store.version}，最新版本：${store.latestVersion}`,
          okButtonTitle: '去下载',
          cancelButtonTitle: '取消'
        }).then(res => {
          if (res.value && store.downloadUrl) {
            Plugins.Browser.open({
              url: store.downloadUrl
            })
          }
        })
      }
    })
  }
})

// Plugins.SplashScreen.hide();

const app = createApp(App)
app.component('cross-image', CrossImage)
app.component('spin-loading', Loading)
app.config.globalProperties = {
  G_PlayTimes(times: number) {
    if (typeof times !== 'number') return '0'
    return times < 10000 ? times : Math.round(times / 10000) + '万'
  },
  G_PubDays(date?:number) {
    if (date) {
      const days = Math.round((Date.now() - date) / (24 * 60 * 60 * 1000))
      if (days) {
        return days + '天前'
      }
      return '今天'
    }
  }
}
app.mount('#app')

const playerHref = 'https://www.bilibili.com/blackboard/html5mobileplayer.html'
const link = document.createElement('link')
link.rel = 'prerender'
link.href = playerHref
document.head.appendChild(link)
// const iframe = document.createElement('iframe')
// iframe.setAttribute('hidden', '')
// iframe.src = playerHref
// document.body.appendChild(iframe)

let isWifi = false
let handler = Plugins.Network.addListener('networkStatusChange', (status) => {
  if (!status.connected) {
    Plugins.Toast.show({ text: '网络连接似乎有问题' })
  } else if (status.connectionType !== 'wifi') {
    isWifi = false
    Plugins.Toast.show({ text: '当前不是WiFi连接，注意流量消耗' })
  } else {
    if (!isWifi) {
      isWifi = true
      Plugins.Toast.show({ text: 'WiFi已连接' })
    }
  }
});

const exitApp = () => {
  Plugins.App.removeAllListeners()
  app.unmount('#app')
  handler.remove()
  window.close()
  return Plugins.App.exitApp();
}

Plugins.Network.getStatus().then(status => {
  if (!status.connected) {
    Plugins.Toast.show({text: '网络连接似乎有问题'})
  } else if (status.connectionType !== 'wifi') {
    Plugins.Modals.confirm({
      title: '注意',
      message: '当前不是Wifi连接，可能会消耗流量',
      okButtonTitle: '继续',
      cancelButtonTitle: '退出'
    }).then((ret) => {
      if (!ret.value) {
        return exitApp()
      }
    });
  } else {
    isWifi = true
  }
})

let timer: number | null = null

Plugins.App.addListener('backButton', () => {
  if (store.currentVideo) {
    if (store.isFullScreen) {
      document.dispatchEvent(new Event('__backbuttonclicked'))
    }
    store.currentVideo = null
    return
  }
  if (store.currentCate || store.currentUp) {
    store.currentCate = null
    store.currentUp = null
    return
  }
  if (timer) {
    return exitApp()
  }
  Plugins.Toast.show({
    text: '再按一次退出'
  });
  timer = window.setTimeout(() => {
    timer = null
  }, 999)
})
