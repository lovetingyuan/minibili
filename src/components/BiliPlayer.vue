<template>
  <div class="player">
    <div class="iframe-container" ref="videoContainerRef" :style="iframeStyle">
      <iframe
        :src="iframeSrc"
        class="player-iframe"
        frameborder="0"
        importance="high"
        v-if="iframeSrc"
        allow="fullscreen"
        ref="iframeRef"
        @webkitfullscreenchange="onfullscreen"
      ></iframe>
    </div>
    <div class="video-info" v-if="video" ref="videoInfoRef">
      <div class="g-noselect">
        <cross-image :url="video.up.face" :default="avatar" class="user-face"></cross-image>
        <span class="user-name">{{video.up.name}}</span>
        <span>{{G_PlayTimes(video.view)}}播放</span>
        <img src="~../assets/share.png" class="share-btn" width="13" @click="onShare" alt="分享" />
      </div>
      <p class="video-title">{{video.title}}</p>
      <p class="video-desc" v-if="video.desc">
        <b class="g-noselect">简介：</b>
        {{video.desc}}
      </p>
      <div class="comments">
        <ol class="comment-list" v-if="video.comments.length">
          <template v-for="(comment, i) of video.comments" :key="comment.user + i">
            <div class="line"></div>
            <li class="comment-item comment-item1">
              <p
                class="comment-content"
                :data-user="`${i+1}.${comment.user}: `"
                :data-like="comment.like ? comment.like+'👍' : ''"
                v-html="comment.content"
              ></p>
              <ul v-if="comment.comments" class="comment-list reply-list">
                <li
                  v-for="reply of comment.comments"
                  :key="reply.user + reply.like"
                  class="comment-item"
                >
                  <p
                    class="comment-content"
                    :data-user="`${reply.user}: `"
                    :data-like="reply.like ? reply.like+'👍' : ''"
                    v-html="reply.content"
                  ></p>
                </li>
              </ul>
            </li>
          </template>
          <p style="text-align:center;margin-top: 20px;">≡ω≡</p>
        </ol>
        <spin-loading v-else></spin-loading>
      </div>
    </div>
    <spin-loading v-else></spin-loading>
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
import { Reply } from '../types';

interface IFrameEle extends HTMLIFrameElement {
  _fullscreen: boolean,
  webkitRequestFullScreen: typeof Element.prototype.requestFullscreen
}

export default {
  name: 'bili-player',
  setup() {
    const iframeRef = ref<HTMLIFrameElement | null>(null)
    const onfullscreen = (e: any) => {
      const iframe = e.target as IFrameEle
      store.orientation = ScreenOrientation.type
      const fullscreen = (iframe._fullscreen = !iframe._fullscreen)
      store.isFullScreen = fullscreen
      if (fullscreen) {
        iframeStyle.value = 'height: 100vh'
        nextTick(() => {
          ScreenOrientation.lock(ScreenOrientation.ORIENTATIONS.LANDSCAPE)
          try {
            if (iframe.requestFullscreen) {
              iframe.requestFullscreen()
            } else if (iframe.webkitRequestFullScreen) {
              iframe.webkitRequestFullScreen()
            }
          } catch (_) { }
        })
      } else {
        ScreenOrientation.lock(store.orientation).then(() => {
          ScreenOrientation.unlock()
          iframeStyle.value = 'height: 60vw'
        })
      }
    }
    document.addEventListener('__backbuttonclicked', () => {
      store.isFullScreen = false
      ScreenOrientation.lock(store.orientation).then(() => {
        ScreenOrientation.unlock()
        iframeStyle.value = 'height: 60vw'
      })
    })
    const iframeSrc = computed(() => {
      if (!store.currentVideo) return ''
      // pc: https://player.bilibili.com/player.html
      return `${playerHref}?bvid=${store.currentVideo.bvid}&autoplay=true&highQuality=true`
    })
    const video = computed(() => {
      return store.currentVideo
    })
    const iframeStyle = ref('')
    const handler = () => {
      store.orientation = ScreenOrientation.type
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
      videoContainerRef, videoInfoRef, getComment(data: Reply, i?: number) {
        return `<b class="g-noselect">${i !== undefined ? (i + 1) + '.' : ''}${data.user}: </b>${data.content}${data.like ? `<small class="g-noselect"> ${data.like}👍</small>` : ''}`
      },
      iframeSrc, onfullscreen, iframeStyle, video, avatar, onShare, iframeRef
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
  transition: height 0.1s;
  transform: translateZ(0);
  will-change: transform;
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
  will-change: scroll-position;
}

.video-title {
  font-size: 16px;
  line-height: 1.4;
}
.video-title::first-letter {
  font-size: 1.4em;
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
  padding-left: 10px;
  font-size: 0.9em;
  border-left: 1px solid #aaa;
  margin-left: 8px;
}

.comments {
  padding: 0;
}
hr {
  margin: 20px 0;
  transform: scale(0.9, 0.6);
}
.comment-content {
  display: inline-block;
  margin: 4px 0;
  line-height: 1.5;
}
.comment-content:before {
  content: attr(data-user);
  font-weight: bold;
}
.comment-content::after {
  content: attr(data-like);
  font-size: 0.8em;
  margin-left: 0.8em;
}

.line {
  border-top: 1px solid #ddd;
  margin: 16px 0;
  transform: scaleY(0.5);
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
}
.user-name {
  font-size: 16px;
  margin-right: 16px;
  font-weight: bold;
}
.share-btn {
  vertical-align: middle;
  margin-left: 16px;
}
</style>
