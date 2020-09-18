<template>
  <img :data-src="imgUrl" :data-default="default" :src="default" alt="封面" ref="imgRef" />
</template>

<script lang="ts">
import { HTTP, getImage } from "../request";
import { ref, onMounted, Ref } from "vue";

let observer: IntersectionObserver
if (window.IntersectionObserver) {
  observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (!entry.target.hasAttribute("data-src")) {
        observer.unobserve(entry.target);
        return;
      }
      const target = entry.target as HTMLImageElement;
      const imgUrl = target.dataset.src as string;
      entry.target.removeAttribute("data-src");

      getImage(imgUrl)
        .then((blobUrl) => {
          target.src = blobUrl;
          observer.unobserve(target);
        })
        .catch(() => {
          if (target.dataset.default) {
            target.src = target.dataset.default;
          }
        });
    });
  });

}

export default {
  name: 'cross-image',
  props: {
    url: {
      type: String,
      required: true,
    },
    default: String,
  },
  setup(props: { url: string; default?: string }) {
    const imgRef = ref<HTMLImageElement | null>(null);
    onMounted(() => {
      observer && observer.observe((imgRef as Ref<HTMLImageElement>).value);
    });
    return { imgUrl: props.url, imgRef, default: props.default };
  },
};
</script>
