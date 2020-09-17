<template>
  <main>
    <keep-alive>
      <component :is="currentComponent"></component>
    </keep-alive>
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
    const scrollTop = {
      'bili-player': 0,
      'video-list': 0,
      'main-view': 0,
    }
    const currentComponent = ref<keyof typeof scrollTop>('main-view')
    watch(() => {
      return [ store.currentVideo, store.currentUp, store.currentCate ]
    }, ([ currentVideo, currentUp, currentCate ], old) => {
      scrollTop[currentComponent.value] = window.scrollY
      if (currentVideo) {
        currentComponent.value = 'bili-player'
      } else if (currentUp || currentCate) {
        currentComponent.value = 'video-list'
      } else {
        currentComponent.value = 'main-view'
      }
      nextTick(() => {
        window.scrollTo(0, scrollTop[currentComponent.value])
      })
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
