import './lib/loadEnv.js'
import { createApp } from './app.js'

const port = Number(process.env.PORT || 37856)
createApp().listen(port, () => {
  console.log(`劳动教育备课助手 API 已启动：http://localhost:${port}`)
})
