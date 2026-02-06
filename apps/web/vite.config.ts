import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@enclose/game-core': path.resolve(__dirname, '../../packages/game-core/src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
