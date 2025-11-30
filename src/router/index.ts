import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/index.vue'),
  },
  {
    path: '/map/:name',
    name: 'Map',
    component: () => import('../components/bms-map.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
