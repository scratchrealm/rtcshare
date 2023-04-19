import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "https://scratchrealm.github.io/rtcshare",
  resolve: {
    alias: {
      "simple-peer": "simple-peer/simplepeer.min.js"
    }
  },
  define: {
    "process.env": {}
  }
})
