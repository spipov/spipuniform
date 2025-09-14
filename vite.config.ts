import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const config = defineConfig({
  server: {
    port: 3350,
    strictPort: true,
  },

  css: {
    devSourcemap: false,
  },

  // Define global variables for SSR compatibility
  define: {
    global: "globalThis",
    exports: "{}",
  },

  // SSR configuration
  ssr: {
    external: ["crypto", "better-auth", "dotenv", "path"],
    noExternal: [],
  },

  // Optimization configuration
  optimizeDeps: {
    // Exclude Solid.js to prevent conflicts with React
    // Exclude server-only modules that shouldn't run in browser
    exclude: ["solid-js", "crypto-browserify", "browserify-sign", "readable-stream", "dotenv", "path"],
  },

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress unused import warnings from node_modules
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && warning.id?.includes('node_modules')) {
          return;
        }
        warn(warning);
      },
      output: {
        manualChunks(id: string) {
          if (id && id.includes('node_modules')) {
            if (id.includes('react') || id.includes('@tanstack/react-query')) {
              return 'vendor';
            }
          }
          if (id && id.includes('src/components/ui')) {
            return 'ui';
          }
        },
      },
    },
  },

  plugins: [
    // Node.js polyfills - minimal set, no crypto since it's server-side only
    nodePolyfills({
      // Only include what's needed for client-side
      include: ["buffer", "process"],
      // Ensure compatibility with SSR
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      customViteReactPlugin: true,
    }),
    viteReact(),
  ],
});

export default config;
