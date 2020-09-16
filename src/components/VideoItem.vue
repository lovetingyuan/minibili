<template>
  <div class="video-item">
    <div class="video-item-img">
      <cross-image :url="pic" @click="openPlayer" :default="videoPic"></cross-image>
    </div>
    <div class="video-text">
      <p class="title">{{index}}.
        <span style="font-weight: bold;" v-if="up">{{up}}: </span>
        <span>{{title}}</span>
      </p>
      <span class="play">
        <img src="~../assets/play.png" class="play-icon" @click="openPlayer" alt="播放" width="12">
        {{play}}
      </span>
      <span class="date"> {{days}}天前</span>
      <span class="cate" v-if="cate">{{cate}}</span>
      <img src="~../assets/share.png" class="share" width="12" @click="onShare" alt="分享">
    </div>
    <span class="video-time">{{time}}</span>
    <span class="play-shape" @click="openPlayer"></span>
  </div>
</template>

<script lang="ts">
import { PropType, toRaw } from 'vue'
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
      required: true
    },
    index: {
      type: Number, required: true
    }
  },
  setup (props: {
    video: Video, index: number
  }) {
    // *  aid, bvid, author, coins, duration, pic, play, title
    const video = props.video
    const days = Math.round((Date.now() - video.date) / (24 * 60 * 60 * 1000))
    const time = new Date(video.len + new Date().getTimezoneOffset() * 60 * 1000)
    const [hour, minute, second] = [time.getHours(), time.getMinutes(), time.getSeconds()]
    const openPlayer = () => {
      store.currentVideo = video
      getComments(video.aid).then(comments => {
        video.comments = comments
      })
    }
    const onShare = () => {
      Share.share({
        title: video.title,
        text: video.title + '\n',
        url: `https://m.bilibili.com/video/` + video.bvid,
        dialogTitle: '分享B站视频'
      });
    }
    // const showDesc = () => {
    //   Plugins.Modals.alert({
    //     title: video.title,
    //     message: video.desc || ''
    //   })
    // }
    return {
      video,
      pic: video.cover,
      title: video.title,
      cate: video.cate,
      play: video.view < 10000 ? video.view : Math.round(video.view / 10000) + '万',
      days: days,
      time: [hour, minute, second].join(':'),
      openPlayer,
      index: props.index,
      videoPic: videoPic,
      up: store.currentUp ? '' : video.up.name,
      onShare
    }
  }
}
</script>
<style scoped>
  .play-icon {
    vertical-align: text-top;
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
  .video-text .cate, .video-text .date, .video-text .play, .video-text .time, .video-text .share {
    font-size: 12px;
    color: #555;
    margin-right: 6px;
  }
  .video-text .share {
    vertical-align: middle;
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
