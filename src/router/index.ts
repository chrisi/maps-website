import {createRouter, createWebHistory} from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/index.vue'),
  },
  {
    path: '/map/:name',
    name: 'Map',
    component: () => import('../components/interactive-map.vue'),
  },
  {
    path: '/dev/anim',
    name: 'DEV',
    component: () => import('../components/dev/anim-test.vue'),
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // This uses the base from vite.config.ts
  routes,
})

export default router
