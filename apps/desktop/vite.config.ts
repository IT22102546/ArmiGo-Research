import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
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
      target: 'https://api.armigorehab.com',
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
      'import.meta.env.VITE_API_URL': JSON.stringify('/api'), // Use proxy in dev
      'import.meta.env.VITE_STORAGE_URL': JSON.stringify('https://api.armigorehab.com/uploads'),
    },
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});