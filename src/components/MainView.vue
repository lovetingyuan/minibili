<template>
  <p class="title g-noselect">
    <img
      src="~../assets/favicon.png"
      alt="bili"
      width="20"
      style="vertical-align:bottom; margin-right: 10px"
    />
    <span>频道排行</span>
    <img src="~../assets/about.png" 
    @click="showAbout"
    width="20" style="vertical-align:bottom; margin-right:20px; float: right;" alt="about">
  </p>
  <div class="channels g-noselect">
    <div class="channel-item" v-for="c of channels" :key="c.name" @click="showCate(c)">{{c.name}}</div>
    <i></i>
    <i></i>
    <i></i>
    <i></i>
    <i></i>
    <i></i>
    <i></i>
    <i></i>
  </div>
  <hr />
  <div v-if="userInfo" class="g-noselect">
    <p class="user-info">
      <span class="user" @click="showUser">
        <span>
          <cross-image :url="userInfo.face" :default="avatar"></cross-image>
        </span>
        <span>{{userInfo.name}}</span>
        <span class="level">L{{userInfo.level}}</span>
      </span>
      <img src="~../assets/logout.png" @click="logout" class="logout" width="16" />
    </p>
    <up-list v-if="userUps"></up-list>
    <spin-loading v-else></spin-loading>
  </div>
  <div v-else-if="!prerender" style="text-align: center;">
    <br />
    <img src="~../assets/bili.svg" alt="bili" width="80" />
    <div class="loginBtn" @click="login">{{loading ? '加载中...' : '登 录'}}</div>
  </div>
  <div v-else>
    <spin-loading></spin-loading>
  </div>
</template>

<script lang="ts">
import UpList, { showUp } from './UpList.vue'
import { computed, watch, ref, onActivated } from 'vue'
import { getAllUps, getRanks, getHomePage, getUserInfo } from '../request'
import store from '../store'
import avatar from '../assets/akari.jpg'
import { Plugins } from '@capacitor/core'
import { Cate, User } from 'src/types'

const channels: Cate[] = [{
  name: '首页', id: -1
}, {
  name: '全站', id: 0
}, {
  name: '知识', id: 36
}, {
  name: '数码', id: 188
}, {
  name: '生活', id: 160
}, {
  name: '美食', id: 211
}, {
  name: '鬼畜', id: 119
}, {
  name: '纪录', id: 177
}]

const fetchUserUps = (uid: string | number) => {
  return getAllUps(uid).finally(() => {
    if (!store.ups) {
      Plugins.Toast.show({ text: `加载关注列表失败` })
    }
  })
}
Plugins.Storage.get({ key: 'userInfo' }).then(result => {
  if (result.value) {
    store.userInfo = JSON.parse(result.value)
    if (store.userInfo) {
      fetchUserUps(store.userInfo.id)
    }
  }
})
Plugins.Storage.get({ key: 'userUps' }).then(result => {
  if (result.value && !store.ups) {
    store.ups = JSON.parse(result.value)
  }
})
export default {
  name: 'main-view',
  components: {
    'up-list': UpList
  },
  setup() {
    const userId = ref('')
    const loading = ref(false)

    const showCate = (cate: Cate) => {
      store.currentUp = null
      store.currentVideo = null
      store.currentCate = cate
      // if (!store.ranks[cate.id]) {
      //   Plugins.Toast.show({ text: '正在加载视频列表...', duration: 'short' })
      // }
      getRanks(cate.id).finally(() => {
        if (!store.ranks[cate.id]) {
          Plugins.Toast.show({ text: `加载${cate.name}的视频失败` })
        }
      })
    }
    const logout = async () => {
      const logoutRet = await Plugins.Modals.confirm({
        cancelButtonTitle: '取消',
        okButtonTitle: '确认',
        message: '确认要注销？' + `(ID: ${store.userInfo && store.userInfo.id})`,
        title: '注销确认'
      })
      if (logoutRet.value) {
        userId.value = ''
        store.userInfo = null
        store.ups = null
        Plugins.Storage.remove({ key: 'userInfo' })
        Plugins.Storage.remove({ key: 'userUps' })
      }
    }
    const login = async () => {
      if (loading.value) return
      const promptRet = await Plugins.Modals.prompt({
        title: '你好~^v^~',
        message: '登录space.bilibili.com，获取地址栏中的数字作为B站ID',
        okButtonTitle: '确定',
        cancelButtonTitle: '取消',
        inputPlaceholder: '请输入B站ID'
      });
      if (promptRet.cancelled) return
      const uid = promptRet.value.trim()
      if (!uid) {
        Plugins.Browser.open({
          url: 'https://space.bilibili.com'
        })
      }
      if (/^\d{1,10}$/.test(uid)) {
        loading.value = true
        await Promise.all([
          getUserInfo(uid),
          fetchUserUps(uid),
        ]).finally(() => {
          if (!store.userInfo) {
            Plugins.Toast.show({
              text: '登录失败，请检查您的ID是否正确'
            })
          }
          loading.value = false
        })
      } else {
        Plugins.Toast.show({
          text: '您的输入有误，正确的ID应该是一组数字'
        })
        login()
      }
    }
    const showUser = () => {
      if (store.userInfo) {
        showUp(store.userInfo)
      }
    }

    const showAbout = () => {
      const [msg1, msg2, msg3] = ['迷你版B站，不要贪杯哦(*^_^*)。', `当前版本：${store.version}，${store.publishDate}`, 'Github: https://github.com/lovetingyuan/minibili']
      if (store.latestVersion && store.latestVersion !== store.version) {
        Plugins.Modals.confirm({
          title: '关于',
          message: [
            msg1, msg2,
            `有新版本：${store.latestVersion}，点击确定下载`,
            '', msg3
          ].join('\n'),
          okButtonTitle: '确定',
          cancelButtonTitle: '取消'
        }).then(res => {
          if (res.value && store.downloadUrl) {
            Plugins.Browser.open({
              url: store.downloadUrl
            })
          }
        })
      } else {
        Plugins.Modals.alert({
          title: '关于',
          message: [msg1, msg2, '', msg3].join('\n')
        })
      }
    }
    return {
      avatar, logout, login, loading, showUser, prerender: !!(window as any).__prerender, showAbout,
      channels, showCate, userId, userInfo: computed(() => store.userInfo), userUps: computed(() => store.ups)
    }
  }
}
</script>

<style scoped>
.title {
  text-indent: 1.2em;
  margin: 28px 0 10px 0;
  user-select: none;
}
.loginBtn {
  text-align: center;
  background-color: var(--theme-color);
  width: fit-content;
  color: white;
  padding: 12px 52px;
  border-radius: 4px;
  margin: 30px auto;
  user-select: none;
}
.channels {
  display: flex;
  flex-wrap: wrap;
  padding: 0 10px;
  justify-content: space-around;
  user-select: none;
}
.channel-item {
  width: 45px;
  height: 45px;
  font-size: 13px;
  letter-spacing: 1px;
  border-radius: 50%;
  text-align: center;
  line-height: 47px;
  background-color: var(--theme-color);
  color: white;
  margin: 14px;
}
/* .channel-item:last-child {
    margin-right: auto;
  } */
.channels > i {
  width: 50px;
  margin: 0 16px;
}
hr {
  transform: scale(0.9, 0.5);
}
.level {
  font-size: 12px;
  background-color: var(--theme-color);
  color: white;
  padding: 0 4px;
  transform: scale(0.9);
  display: inline-block;
  border-radius: 2px;
  font-style: italic;
  margin-left: 8px;
  vertical-align: middle;
}
.input {
  padding: 6px 10px;
  margin-left: 20px;
  width: 50vw;
  border: 0 none;
  border-bottom: 1px solid #aaa;
  outline: none;
}
.input:focus {
  border-bottom: 1px solid #666;
}
.user-info {
  padding: 0 1.2em;
  font-size: 16px;
  user-select: none;
}
.logout {
  float: right;
  position: relative;
  top: 5px;
}
.user img {
  width: 1.8em;
  height: 1.8em;
  vertical-align: middle;
  border-radius: 50%;
  margin-right: 10px;
}
</style>
