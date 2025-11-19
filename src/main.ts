import {createApp} from 'vue'
import App from './App.vue'
import {pinia} from "@/plugins/pinia.ts";

console.log("createing app")
const app = createApp(App)

console.log("registering pinia to app")
app.use(pinia)

console.log("mounting app")
app.mount('#app')
