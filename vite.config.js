import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

const isHttps = process.env.VITE_HTTPS === 'true';

export default defineConfig({
  plugins: [
    react(),
    ...(isHttps ? [basicSsl()] : []),
  ],
  server: {
    port: 3000,
    open: true,
    allowedHosts: true,
  },
});
