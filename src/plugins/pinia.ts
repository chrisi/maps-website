import {createPinia, type PiniaPluginContext} from 'pinia';

export const pinia = createPinia();

export function persistPlugin({store, options}: PiniaPluginContext) {
  const stored = localStorage.getItem(store.$id)

  if (stored) {
    store.$patch(JSON.parse(stored))
  }

  store.$subscribe((_, state) => {
    if (options.persist === false)
      return
    console.log(`storing locally '${store.$id}': `, state)
    localStorage.setItem(store.$id, JSON.stringify(state))
  })
}

pinia.use(persistPlugin)
