import {createPinia, type PiniaPluginContext} from 'pinia';

// enable static access to the singleton pinia instance
// useful for plain / non-vue code need to access the store
console.log('creating pinia')
export const pinia = createPinia();

export function persistPlugin({store}: PiniaPluginContext) {
  const stored = localStorage.getItem(store.$id)

  if (stored) {
    store.$patch(JSON.parse(stored))
  }

  store.$subscribe((_, state) => {
    console.log(`storing locally '${store.$id}': `, state)
    localStorage.setItem(store.$id, JSON.stringify(state))
  })
}

console.log("registering localstore-plugin to pinia")
pinia.use(persistPlugin)
