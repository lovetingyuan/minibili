<template>
  <main>
    <keep-alive>
      <component :is="currentComponent"></component>
    </keep-alive>
    <img src="~./assets/akari.jpg" hidden alt />
    <img src="~./assets/video.png" hidden alt />
  </main>
</template>

<script lang="ts">
import VideoList from './components/VideoList.vue'
import BiliPlayer from './components/BiliPlayer.vue'
import MainView from './components/MainView.vue'
import store from './store'
import { nextTick, ref, watch, watchEffect } from 'vue'

export default {
  name: 'App',
  components: {
    VideoList, BiliPlayer, MainView
  },
  setup() {
    const currentComponent = ref<'bili-player' | 'video-list' | 'main-view'>('main-view')
    // main-view -> video-list -> bili-player
    let videolistscrolly = window.scrollY
    let mainviewscrolly = window.scrollY
    document.addEventListener('__keepvideolistscrolly', () => {
      window.scrollTo(0, videolistscrolly)
    })
    watch(() => {
      return [store.currentVideo, store.currentUp, store.currentCate]
    }, ([currentVideo, currentUp, currentCate], old) => {
      if (currentVideo) {
        videolistscrolly = window.scrollY
        currentComponent.value = 'bili-player'
      } else if (currentUp || currentCate) {
        if (currentComponent.value === 'main-view') {
          mainviewscrolly = window.scrollY
          videolistscrolly = 0
        }
        nextTick(() => {
          window.scrollTo(0, videolistscrolly)
        })
        currentComponent.value = 'video-list'
      } else {
        videolistscrolly = 0
        currentComponent.value = 'main-view'
        nextTick(() => {
          window.scrollTo(0, mainviewscrolly)
        })
      }
    })
    return { currentComponent }
  }
}
</script>

<style scoped>
.tabs {
  position: fixed;
  width: 100%;
  bottom: 0;
  background-color: white;
  display: flex;
  box-shadow: 0 0 16px 4px #ddd;
}
.tab-item {
  flex: 1;
  font-size: 14px;
  padding: 16px 0;
  text-align: center;
  border-right: 1px solid #ddd;
}
.tab-item:last-child {
  border: none;
}
</style>
