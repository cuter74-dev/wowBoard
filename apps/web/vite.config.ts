import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // react-rnd / react-draggable reference `process.env.*` at runtime, which
  // is undefined in the browser and throws "process is not defined".
  // Provide a minimal shim so those guards evaluate to undefined.
  define: {
    'process.env': JSON.stringify({ NODE_ENV: mode }),
  },
  server: {
    host: true, // bind 0.0.0.0 so remote hosts (e.g. dev.brainsp.com) can reach it
    port: 7100,
    strictPort: true,
    allowedHosts: true, // allow access via any hostname
  },
  // Static serving of the production build (hashed assets → no stale cache).
  preview: {
    host: true,
    port: 7100,
    strictPort: true,
    allowedHosts: true,
    // OAuth callbacks are registered on the web host (7100) but must reach the
    // backend's passport handler (7000). Proxy /callback/<provider>/login →
    // /auth/<provider>/callback. No SPA route uses /callback, so this is safe.
    proxy: {
      '^/callback/[^/]+/login': {
        target: 'http://localhost:7000',
        changeOrigin: false,
        rewrite: (path) =>
          path.replace(/^\/callback\/([^/]+)\/login/, '/auth/$1/callback'),
      },
    },
  },
}));
