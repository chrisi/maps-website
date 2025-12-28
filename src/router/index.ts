import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/maps-website/',
    name: 'Home',
    component: () => import('../components/index.vue'),
  },
  {
    path: '/maps-website/map/:name',
    name: 'Map',
    component: () => import('../components/bms-map.vue'),
  },
  {
    path: '/maps-website/pan-test',
    name: 'Test',
    component: () => import('../components/main-map-cnv.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
