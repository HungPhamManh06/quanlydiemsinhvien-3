import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Use prebuilt browser bundle of xlsx so viteSingleFile can inline it
      "xlsx": path.resolve(__dirname, "node_modules/xlsx/dist/xlsx.full.min.js"),
    },
  },
  optimizeDeps: {
    include: ['xlsx'],
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress xlsx-related Node built-in warnings
        if (
          warning.code === 'MODULE_LEVEL_VARIABLE' ||
          (warning.message && warning.message.includes('xlsx'))
        ) return;
        warn(warning);
      },
    },
  },
});

