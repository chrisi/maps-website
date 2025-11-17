import { createPinia } from 'pinia';

// enable static access to the singleton pinia instance
// useful for plain / non-vue code need to access the store
export const pinia = createPinia();
