import {createApp} from 'vue'
import App from './App.vue'
import {pinia} from "@/plugins/pinia.ts";

const app = createApp(App)

// export const pinia = createPinia();
//
// pinia.use(({store}) => {
//   console.log('register store', store)
//   store.$subscribe(() => {
//     console.log('subscribe called', store.$state)
//   })
//   store.$onAction(() => {
//     console.log('action called', store.$state)
//   })
// })
//
// export function persistPlugin({store}: PiniaPluginContext) {
//   const stored = localStorage.getItem(store.$id)
//
//   if (stored) {
//     store.$patch(JSON.parse(stored))
//   }
//
//   store.$subscribe((_, state) => {
//     console.log('store local', store.$id, state)
//     localStorage.setItem(store.$id, JSON.stringify(state))
//   })
// }
//
// pinia.use(persistPlugin)

app.use(pinia)

app.mount('#app')
