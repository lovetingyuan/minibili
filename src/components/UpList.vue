<template>
  <ul class="up-list" v-if="ups.length">
    <li v-for="up of ups" :key="up.mid" class="up-item">
      <up-item :face="up.face" :name="up.name" @click="showUp(up)"></up-item>
    </li>
  </ul>
  <p v-else style="text-align: center; margin: 50px 0;">关注列表为空</p>
</template>

<script lang="ts">
import { computed, ref } from "vue";
import UpItem from "./UpItem.vue";
import store from "../store";
import { Plugins } from "@capacitor/core";
import { getUpVideos, getAllUps } from "../request";
import { User } from "src/types";

export const showUp = (up: User) => {
  store.currentUp = up;
  store.currentCate = null;
  store.currentVideo = null
  if (!store.upVideos[up.id]) {
    Plugins.Toast.show({ text: "正在加载视频列表..." });
  }
  getUpVideos(up.id).finally(() => {
    if (!store.upVideos[up.id]) {
      Plugins.Toast.show({ text: `加载${up.name}的视频失败` });
    }
  });
};

export default {
  name: 'up-list',
  components: {
    'up-item': UpItem
  },
  setup() {
    const ups = computed(() => store.ups);
    return { ups, showUp };
  },
};
</script>

<style scoped>
.up-list {
  list-style: none;
  padding: 0 10px;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}
.up-item:last-child {
  margin-right: auto;
}
</style>
