import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      sonner: path.resolve(__dirname, "node_modules/sonner/dist/index.js"),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-dom') || (id.includes('node_modules/react/') && !id.includes('react-router'))) return 'vendor-react';
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/@radix-ui') || id.includes('node_modules/@tanstack')) return 'vendor-ui';
        },
      },
    },
  }
});
