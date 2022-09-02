<template>
  <div class="video-item">
    <div class="video-item-img">
      <cross-image :url="pic" @click="openPlayer" :default="videoPic"></cross-image>
    </div>
    <div class="video-text">
      <p class="title" v-if="title">{{index}}.
        <span class="up">{{up ? up + ': ' : ''}}</span>
        <span class="title-content">{{title}}</span>
      </p>
      <div v-else style="background-color: #ddd; height: 2em; width: 55vw; margin-top: 5px; margin-bottom: 14px;"></div>
      <template v-if="title">
        <img src="~../assets/play.png" class="play-icon" @click="openPlayer" alt="播放" width="12">
        <span class="play">{{G_PlayTimes(play)}}</span>
        <span class="date">{{G_PubDays(days)}}天前</span>
        <span class="cate">{{cate}}</span>
        <img src="~../assets/share.png" class="share g-vamiddle" width="12" @click="onShare" alt="分享">
      </template>
      <div v-else style="background-color: #ddd; height: 1em; width: 50vw;"></div>
    </div>
    <span class="video-time">{{time}}</span>
    <span class="play-shape" @click="openPlayer"></span>
  </div>
</template>

<script lang="ts">
import { onMounted, PropType, toRaw } from 'vue'
import videoPic from '../assets/video.png'
import store from '../store'
import { Plugins } from '@capacitor/core';
const { Share } = Plugins;
import { getComments } from '../request'
import { Video } from 'src/types';

export default {
  name: 'video-item',
  props: {
    video: {
      type: Object as PropType<Video>,
      required: false
    },
    index: {
      type: Number, required: true
    }
  },
  setup (props) {
    const video = props.video
    const openPlayer = () => {
      if (!video) return
      store.currentVideo = video
      getComments(video.aid).then(comments => {
        video.comments = comments || []
      })
    }
    const onShare = () => {
      if (!video) return
      Share.share({
        title: video.title,
        text: video.title + '\n',
        url: `https://m.bilibili.com/video/` + video.bvid,
        dialogTitle: '分享B站视频'
      });
    }
    let time: string = ''
    if (video) {
      const date = new Date(video.len + new Date().getTimezoneOffset() * 60 * 1000)
      time = [date.getHours(), date.getMinutes(), date.getSeconds()].join(':')
    }
    const data = {
      pic: video && video.cover,
      title: video && video.title,
      cate: video && video.cate,
      play: video && video.view,
      days: video && video.date,
      time: time,
      openPlayer,
      index: props.index,
      videoPic: videoPic,
      up: store.currentUp ? '' : (video && video.up.name),
      onShare
    }
    return data
  }
}
</script>
<style scoped>
  .play-icon {
    vertical-align: middle;
    margin-right: 5px;
  }
  .video-item {
    text-align: left;
    overflow: hidden;
    margin: 20px 0;
    position: relative;
  }
  .video-item-img {
    float: left;
    margin-right: 10px;
    width: 36vw;
    border: 1px solid #ddd;
    border-radius: 2px;
    font-size: 0;
  }
   .video-item-img img {
     width: 100%;
     max-height: 24vw;
     object-fit: cover;
   }
   .video-text {
     overflow: hidden;
   }
  .video-text .title {
    margin: 5px 0;
    font-size: 14px;
    text-overflow: ellipsis;
    overflow: hidden;
    display:-webkit-box;
    -webkit-line-clamp:3;
    -webkit-box-orient:vertical;
  }
  .up {
    font-weight: bold;
  }
  /* .title-content:empty {
    background-color: #ddd;
    height: 2em;
    display: inline-block;
    width: 55vw;
  } */
  .video-text .cate, .video-text .date, .video-text .play, .video-text .time, .video-text .share {
    font-size: 12px;
    color: #555;
    margin-right: 6px;
  }

  .video-time {
    position: absolute;
    top: 5px;
    left: 2px;
    background-color: white;
    padding: 2px 4px;
    font-size: 12px;
    border-radius: 2px;
    transform: scale(.85);
  }
  .play-shape {
    position: absolute;
    top: 9vw;
    left: 15vw;
    display: block;
    width: 0;
    height: 0;
    border: 3vw solid transparent;
    border-left: 6vw solid rgba(255,255,255, .9);
  }
</style>
