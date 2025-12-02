<script setup lang="ts">
import {useRouter} from "vue-router";

defineProps<{
  link?: string
  name: string
  sub?: string
  image: string
}>()

const router = useRouter()

const openLink = (url?: string) => {
  if (!url) return
  if (url.startsWith('http'))
    window.open(url, '_blank') //window.location.href = url
  else
    router.push(url)
}

</script>

<template>
  <div class="polaroid" @click="openLink(link)" :class="{active: link}">
    <img :src="`https://cdn.falcon-bms.com/maps/web_assets/${image}`" width="150" height="150" :alt="name" class="image">
    <div class="title">{{ name }}</div>
    <div class="sub">{{ sub }}</div>
  </div>
</template>
<style scoped>

.polaroid {
  width: 155px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  padding: 5px 3px;
  text-align: center;
  border-radius: 6px;
  border: 1px solid #bbb;
}

.polaroid img {
  border-radius: 3px;
}

.active {
  cursor: pointer;
}

.title {
  font-size: larger;
  font-weight: bold;
  text-align: center;
  padding: 2px;
}

.sub {
  font-size: small;
  font-style: italic;
  font-weight: bold;
  text-align: center;
  color: #5a87a4;
  padding: 2px;
}

.polaroid:hover {
  opacity: 0.8;
  color: #000000;
}
</style>
