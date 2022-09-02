<template>
<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=" v-if="showImg" hidden @load="onLoad">
  <p class="title" :style="`padding: ${pic ? '13px' : '16px'} 0`">
    <img src="~../assets/back.png" alt="返回" class="back-icon" @click="onBack" width="16" />
    <span class="upface" v-if="pic">
      <cross-image :url="pic" :default="avatar"></cross-image>
    </span>
    <span class="text">{{title}}</span>
  </p>
  <div v-if="videoList">
    <ol v-if="videoList.length" class="video-list">
      <li v-for="(video, i) of videoList" :key="video.bvid" class="video-item">
        <video-item :video="video" :index="i + 1"></video-item>
      </li>
      <p style="text-align:center;margin-top: 20px;">≡ω≡</p>
    </ol>
    <div v-else style="text-align: center; margin: 80px 0;">
      <img src="~../assets/bili.svg" alt="bili" width="100" />
      <p>
        <br />视频列表为空(lll￢ω￢)
      </p>
    </div>
  </div>
  <ol v-else class="video-list">
    <li v-for="(i) in 10" class="video-item">
      <video-item :index="i"></video-item>
    </li>
  </ol>
  <!-- <spin-loading v-else></spin-loading> -->
</template>

<script lang="ts">
import { ref, computed, onActivated, onDeactivated } from 'vue';
import request, { getUpVideos } from '../request'
import VideoItem from './VideoItem.vue'
import store from '../store'
import avatar from '../assets/akari.jpg'

export default {
  name: 'video-list',
  components: { VideoItem },
  setup() {
    const showImg = ref(false)
    onActivated(() => {
      showImg.value = true
    })
    onDeactivated(() => {
      showImg.value = false
    })
    const videoList = computed(() => {
      if (store.currentUp && store.upVideos[store.currentUp.id]) {
        return store.upVideos[store.currentUp.id].list
      } else if (store.currentCate && store.ranks[store.currentCate.id]) {
        return store.ranks[store.currentCate.id]
      }
      return null
    })
    const title = computed(() => {
      if (store.currentUp) {
        return store.currentUp.name + '投稿的视频'
      } else if (store.currentCate) {
        if (store.currentCate.id === -1) {
          return document.title
        }
        return store.currentCate.name + '频道的排行'
      }
      return document.title
    })
    const pic = computed(() => {
      if (store.currentUp) {
        return store.currentUp.face
      }
      return ''
    })
    return {
      videoList, title, pic, avatar, onBack() {
        store.currentCate = null
        store.currentUp = null
      }, onLoad() {
        document.dispatchEvent(new Event('__keepvideolistscrolly'))
      }, showImg
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
  font-size: 16px;
  background-color: white;
  z-index: 1;
  margin: 0;
  box-shadow: 0 0 12px 2px #aaaaaa;
  user-select: none;
}
.title .text {
  position: relative;
  top: 2px;
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
