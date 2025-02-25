import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Default base is '/' which works for most cases
  // When deploying to GitHub Pages, we need to use the repo name as the base
  // For Cloudflare Pages and HuggingFace, '/' works fine
  const base = mode === 'github' ? '/sheer/' : '/';

  return {
    base,
    build: {
      target: "esnext",
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        'http://localhost:11434': {
          target: 'http://localhost:11434',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});
