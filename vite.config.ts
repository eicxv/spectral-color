/// <reference types="vitest" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  root: "./",
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    lib: {
      entry: "./src/index.ts",
      name: "spectral-color",
      fileName: (format) => `spectral-color.${format}.js`,
    },
  },
  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
  test: {},
});
