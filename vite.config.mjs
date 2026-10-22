import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {nodeDependencyResolver} from './scripts/esbuild-node-resolver.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const dependencies = ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'lucide-react'];

export default defineConfig(({command}) => ({
  plugins: [
    react(),
    {
      name: 'capm-local-csp',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          if (command !== 'serve') return html;
          return html.replace(
            /<meta http-equiv="Content-Security-Policy"[^>]*>/,
            '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; font-src \'self\'; connect-src \'self\' ws: wss:; object-src \'none\'; base-uri \'self\'; form-action \'none\';"/>'
          );
        }
      }
    }
  ],
  base: './',
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'self'; form-action 'none';"
    }
  },
  optimizeDeps: {
    noDiscovery: true,
    include: dependencies,
    esbuildOptions: {plugins: [nodeDependencyResolver(root, dependencies)]}
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-dom/client'],
          preguntas: ['./src/data/questions.json'],
          exitos: ['./src/data/collections/exitos-simulador-01.json'],
          'exitos-original': ['./src/data/collections/exitos-simulador-01-v1.json'],
          procesos: ['./src/data/collections/grupo-procesos-simulador-02.json'],
          'procesos-original': ['./src/data/collections/grupo-procesos-simulador-02-v1.json'],
          'fuentes-procesos': ['./src/data/collections/procesos-sources.json'],
          'fuentes-exitos': ['./src/data/collections/exitos-sources.json', './src/data/collections/exitos-review-sources.json']
        }
      }
    }
  }
}));
