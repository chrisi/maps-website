import {createApp} from 'vue'
import App from './App.vue'
import {pinia} from "@/pinia.ts";

const app = createApp(App)

app.use(pinia)

app.mount('#app')
