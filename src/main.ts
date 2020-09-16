import { createApp } from 'vue'
import App from './App.vue'
import CrossImage from './components/CrossImage.vue'
import 'normalize.css'
import './index.css'
import store from './store'
import { Plugins } from '@capacitor/core'

const app = createApp(App)
app.component('cross-image', CrossImage)
app.mount('#app')

const playerHref = 'https://www.bilibili.com/blackboard/html5mobileplayer.html'
const link = document.createElement('link')
link.rel = 'prerender'
link.href = playerHref
document.head.appendChild(link)

Plugins.Browser.addListener('browserPageLoaded', () => {
  Plugins.Browser.prefetch({
    urls: [playerHref]
  })
})

let handler = Plugins.Network.addListener('networkStatusChange', (status) => {
  if (!status.connected) {
    Plugins.Toast.show({ text: '网络连接似乎有问题' })
  } else if (status.connectionType !== 'wifi') {
    Plugins.Toast.show({ text: '当前不是Wifi连接，注意流量消耗' })
  }
});

const exitApp = () => {
  app.unmount('#app')
  handler.remove()
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
  }
})

let timer: number | null = null

Plugins.App.addListener('backButton', () => {
  if (store.currentVideo) {
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
