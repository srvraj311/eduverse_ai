import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": { target: "http://127.0.0.1:8000", changeOrigin: true } },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("tsparticles")) return "particles";
          if (id.includes("katex") || id.includes("highlight.js") || id.includes("lowlight")) return "rich";
        },
      },
    },
  },
});
