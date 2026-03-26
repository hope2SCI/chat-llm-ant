import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const deepSeekBaseUrl = env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com'
  const deepSeekApiPath = env.DEEPSEEK_API_PATH || '/v1/chat/completions'
  const deepSeekApiKey = env.DEEPSEEK_API_KEY || ''

  return {
    plugins: [
      vue(),
      AutoImport({
        // 自动导入常用 API，减少每个 .vue 手动 import
        imports: ['vue', 'pinia'],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        // 自动识别 <a-button /> 等 Ant Design Vue 组件
        resolvers: [
          AntDesignVueResolver({
            importStyle: false,
            resolveIcons: true,
          }),
        ],
      }),
    ],
    server: {
      proxy: {
        '/api/chat': {
          target: deepSeekBaseUrl,
          changeOrigin: true,
          rewrite: () => deepSeekApiPath,
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              if (deepSeekApiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${deepSeekApiKey}`)
              }
              proxyReq.setHeader('Content-Type', 'application/json')
            })
          },
        },
      },
    },
  }
})
