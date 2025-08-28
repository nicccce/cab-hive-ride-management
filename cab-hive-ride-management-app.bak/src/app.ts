import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './app.scss'

const App = createApp({
  onShow() {
    console.log('App launched.')
  }
})

App.use(createPinia())

export default App