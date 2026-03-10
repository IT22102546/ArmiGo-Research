import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  
  return {
    plugins: [
      react(),
      electron([
        {
          entry: 'electron/main.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron'],
              },
            },
          },
        },
        {
          entry: 'electron/preload.ts',
          onstart(args) {
            args.reload();
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron'],
              },
            },
          },
        },
      ]),
      electronRenderer(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Add proxy configuration
server: {
  proxy: {
    '/api': {
      target: 'http://192.168.1.103:5000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api, not add another one
      configure: (proxy, _options) => {
        proxy.on('error', (err, _req, _res) => {
          console.log('proxy error', err);
        });
      },
    },
  },
},
    define: {
      // In dev: use proxy path "/api". In production: use real API URL directly
      'import.meta.env.VITE_API_URL': JSON.stringify(
        isProd ? 'https://api.armigorehab.com' : '/api'
      ),
      'import.meta.env.VITE_STORAGE_URL': JSON.stringify('https://api.armigorehab.com/uploads'),
    },
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: 'esbuild',
      sourcemap: false,
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
      cssCodeSplit: false, // Keep all CSS in one file
    },
  };
});