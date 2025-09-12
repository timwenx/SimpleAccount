import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'


Vue.config.productionTip = false
App.mpType = 'app'

const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import { saveStorageAndFile, saveJSONToDCIM, checkStoragePermission } from './utils/globalMethods'

export function createApp() {
  const app = createSSRApp(App)
  
  // ✅ 挂载到全局属性
  app.config.globalProperties.$saveStorageAndFile = saveStorageAndFile
  app.config.globalProperties.$saveJSONToDCIM = saveJSONToDCIM
  app.config.globalProperties.$checkStoragePermission = checkStoragePermission
  return {
    app
  }
}
// #endif