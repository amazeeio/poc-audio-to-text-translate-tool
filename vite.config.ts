import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 8000,
      // Browser calls /v1/* same-origin; proxy forwards to LiteLLM to avoid CORS.
      proxy: {
        '/v1': {
          target: env.VITE_LITELLM_API_URL || 'https://llm.us104.amazee.ai',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
