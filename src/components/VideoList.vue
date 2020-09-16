<template>
  <p class="title">
    <img src="~../assets/back.png" alt="返回" class="back-icon" @click="onBack" width="16">
    <span class="upface" v-if="pic">
      <cross-image :url="pic" ::default="avatar"></cross-image>
    </span>
    <span style="text">{{title}}</span>
  </p>
  <ol v-if="videoList.length" class="video-list">
    <li v-for="(video, i) of videoList" :key="video.bvid" class="video-item">
      <video-item :video="video" :index="i + 1"></video-item>
    </li>
  </ol>
  <p v-else style="text-align: center;margin: 80px 0;">视频列表为空(lll￢ω￢)</p>
</template>

<script lang="ts">
import { ref, computed } from 'vue';
import request, { getUpVideos } from '../request'
import VideoItem from './VideoItem.vue'
import store from '../store'
import avatar from '../assets/akari.jpg'

export default {
  name: 'video-list',
  components: { VideoItem },
  setup() {
    const videoList = computed(() => {
      if (store.currentUp && store.upVideos[store.currentUp.id]) {
        return store.upVideos[store.currentUp.id].list
      } else if (store.currentCate && store.ranks[store.currentCate.id]) {
        return store.ranks[store.currentCate.id]
      }
      return []
    })
    const defaultTitle = 'Minibili(゜-゜)つロ千杯~'
    const title = computed(() => {
      if (store.currentUp) {
        return store.currentUp.name + '投稿的视频'
      } else if (store.currentCate) {
        if (store.currentCate.id === -1) {
          return defaultTitle
        }
        return store.currentCate.name + '频道的排行'
      }
      return defaultTitle
    })
    const pic = computed(() => {
      if (store.currentUp) {
        return store.currentUp.face
      }
      return ''
    })
    return {
      videoList, title, pic, avatar, onBack() {
        // store.showVideoList = false
        store.currentCate = null
        store.currentUp = null
      }
    }
  }
}
</script>

<style scoped>
.video-list {
  margin: 0;
  padding: 0 10px;
  list-style: none;
}
.title {
  text-indent: 10px;
  position: sticky;
  top: 0;
  font-size: 14px;
  background-color: white;
  z-index: 1;
  margin: 0;
  padding: 14px 0;
  box-shadow: 0 0 12px 2px #aaaaaa;
  user-select: none;
}
.back-icon {
  vertical-align: middle;
  margin-right: 8px;
  /* font-size: 24px;
  font-weight: 300;
  display: inline-block;
  transform: translateY(2px) scaleY(1.4); */
}
.upface img {
  width: 24px;
  height: 24px;
  display: inline-block;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 10px;
}

</style>
