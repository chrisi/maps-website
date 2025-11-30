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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
