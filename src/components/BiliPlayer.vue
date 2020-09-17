<template>
  <div class="player">
    <div class="iframe-container"
      ref="videoContainerRef"
      :style="iframeStyle">
      <iframe
        :src="iframeSrc"
        class="player-iframe"
        frameborder="0"
        importance="high"
        v-if="iframeSrc"
        allow="fullscreen"
        @webkitfullscreenchange="onfullscreen"
      ></iframe>
    </div>
    <div class="video-info" v-if="video" ref="videoInfoRef">
      <div class="up-info">
        <cross-image :url="video.up.face" :default="avatar" class="user-face"></cross-image>
        <span class="user-name">{{video.up.name}}</span>
        <span>{{video.view < 10000 ? video.view : (Math.round(video.view / 10000) + '万')}}播放</span>
        <img src="~../assets/share.png" class="share-btn" width="13" @click="onShare" alt="分享">
      </div>
      <p class="video-title">{{video.title}}</p>
      <p class="video-desc" v-if="video.description">简介：{{video.description}}</p>
      <div class="comments">
        <ol class="comment-list" v-if="video.comments.length">
          <template v-for="(comment, i) of video.comments" :key="comment.user + i">
            <div class="line"></div>
            <li class="comment-item comment-item1">
              <p class="comment-content"
                v-html="`<b>${i + 1}. ${comment.user}: </b>${comment.content} ${comment.like ? `<small>${comment.like}👍</small>` : ''}`">
              </p>
              <ul v-if="comment.comments" class="comment-list reply-list">
                <li v-for="reply of comment.comments" :key="reply.user + reply.like" class="comment-item">
                  <p class="comment-content"
                    v-html="`<b>${reply.user}: </b>${reply.content} ${reply.like ? `<small>${reply.like}👍</small>` : ''}`">
                  </p>
                </li>
              </ul>
            </li>
          </template>
        </ol>
        <p v-else style="text-align: center;margin: 50px 0; font-size: 30px;">. . .</p>
      </div>
    </div>
    <p v-else style="text-align: center; font-size: 30px; margin: 60px 0;">
      . . .
    </p>
  </div>
</template>

<script lang="ts">
import store from '../store'
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Plugins } from '@capacitor/core';
import avatar from '../assets/akari.jpg'

const playerHref = 'https://www.bilibili.com/blackboard/html5mobileplayer.html'
import useTouchMove from './touchmove'
import { getImage } from '../request';

export default {
  name: 'bili-player',
  setup() {
    const onfullscreen = (e: any) => {
      const iframe = e.target
      const fullscreen = (iframe._fullscreen = !iframe._fullscreen)
      if (fullscreen) {
        ScreenOrientation.lock(ScreenOrientation.ORIENTATIONS.LANDSCAPE)
        iframeStyle.value = 'height: 100vh'
      } else {
        ScreenOrientation.lock(ScreenOrientation.ORIENTATIONS.PORTRAIT)
        ScreenOrientation.unlock()
        iframeStyle.value = ''
      }
    }
    const iframeSrc = computed(() => {
      if (!store.currentVideo) {
        ScreenOrientation.lock(ScreenOrientation.ORIENTATIONS.PORTRAIT)
        ScreenOrientation.unlock()
        return ''
      }
      // pc: https://player.bilibili.com/player.html
      return `${playerHref}?bvid=${store.currentVideo.bvid}&autoplay=true&highQuality=true`
    })
    const video = computed(() => {
      return store.currentVideo
    })
    const iframeStyle = ref('')
    const handler = () => {
      if (ScreenOrientation.type.startsWith('landscape')) {
        iframeStyle.value = 'height: 100vh'
        // Plugins.StatusBar.setOverlaysWebView({ overlay: true })
      } else {
        iframeStyle.value = 'height: 60vw'
      }
    }
    ScreenOrientation.onChange().subscribe(handler);
    handler()
    const onShare = () => {
      if (!video.value) return
      Plugins.Share.share({
        title: video.value.title,
        text: video.value.title + '\n',
        url: `https://m.bilibili.com/video/` + video.value.bvid,
        dialogTitle: '分享B站视频'
      });
    }
    const videoContainerRef = ref(null)
    const videoInfoRef = ref(null)

    useTouchMove(videoContainerRef, videoInfoRef)
    return {
      videoContainerRef, videoInfoRef,
      iframeSrc, onfullscreen, iframeStyle, video, avatar, onShare
    }
  }
}
</script>

<style scoped>
.player {
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.iframe-container {
  box-shadow: 0 0 10px 3px #555;
  z-index: 1;
  width: 100%;
  background-color: black;
  resize: vertical;
  overflow: auto;
  flex-shrink: 0;
}
.player-iframe {
  width: 100%;
  height: 100%;
  display: block;
}
.video-info {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: 14px;
  padding: 20px 20px;
  background-color: white;
}
/* .video-info-top {
  position: absolute;
  height: 1px;
  width: 100%;
  top: 0;
} */
.video-title {
  font-size: 16px;
}
.video-desc {
  line-height: 1.4;
  padding: 0 5px;
}
.comment-list {
  margin: 0;
  padding: 0;
  list-style: none;
  list-style-position: inside;
}
/* .comment-item1 {
  background: linear-gradient(#ddd, #fff 10%);
} */
.reply-list {
  padding-left: 14px;
  font-size: .9em;
}

.comments {
  padding: 0;
}
hr {
  margin: 20px 0;
  transform: scale(.9, .6);
}
.comment-content {
  display: inline-block;
  margin: 4px 0;
  line-height: 1.5;
}

.line {
  border-top: 1px solid #ddd;
  margin: 16px 0;
  transform: scaleY(.5);
}
.line:first-child {
  border-color: #999;
  margin-top: 24px;
}
.user-face {
  width: 32px;
  height: 32px;
  vertical-align: middle;
  display: inline-block;
  border-radius: 50%;
  margin-right: 10px;
  border: 1px solid #ddd;
}
.user-name {
  font-size: 16px;
  margin-right: 16px;
  font-weight: bold;
}
.share-btn {
  vertical-align: middle; margin-left: 16px;
}
</style>
