import react from '@vitejs/plugin-react'
import Checker from 'vite-plugin-checker'
import { resolve } from 'path'
import { UserConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

function pathResolve(dir: string) {
  return resolve(__dirname, '.', dir)
}

const shouldAnalyze = process.env.ANALYZE

const config: UserConfig = {
  resolve: {
    alias: [
      {
        find: /@\//,
        replacement: pathResolve('src') + '/'
      }
    ]
  },
  build: {
    rollupOptions: {
      plugins: !!shouldAnalyze ? [visualizer({ open: true, filename: './bundle-size/bundle.html' })] as never : []
    },
    sourcemap: !!shouldAnalyze
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    // If you have other specific 'process.env' variables your client code needs,
    // they should be explicitly added here, e.g.:
    // 'process.env.MY_VARIABLE': JSON.stringify(process.env.MY_VARIABLE)
  },
  server: {
    port: 3000
  },
  plugins: [
    react(),
    Checker({
      typescript: true,
      overlay: true,
      eslint: {
        files: 'src',
        extensions: ['.ts', '.tsx']
      }
    })
  ],
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  }
}

const getConfig = () => config

export default getConfig
