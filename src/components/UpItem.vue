<template>
  <div class="up-item">
    <cross-image :url="face" :default="avatar"></cross-image>
    <span class="name">{{name}}</span>
  </div>
</template>

<script lang="ts">
import avatar from '../assets/akari.jpg'

export default {
  name: 'up-item',
  props: {
    face: {
      type: String, required: true
    },
    name: {
      type: String, required: true
    }
  },
  setup (props) {
    return {
      name: props.name,
      face: props.face,
      avatar
    }
  }
}
</script>

<style scoped>
  .up-item img {
    width: 66%;
    max-width: 60px;
    /* height: 66%; */
    min-height: 30px;
    display: block;
    margin: 0 auto;
    margin-bottom: 10px;
    border-radius: 50%;
  }
  .up-item {
    text-align: center;
    font-size: 12px;
    margin: 14px 10px;
    width: 20vw;
  }
  .name {
    word-break: break-word;
  }
</style>
