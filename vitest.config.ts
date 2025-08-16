import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.tsx"],
    include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
    exclude: ["tests/e2e/**/*", "node_modules/**/*", "dist/**/*"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@components": resolve(__dirname, "./src/components"),
      "@lib": resolve(__dirname, "./src/lib"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@types": resolve(__dirname, "./src/types"),
    },
  },
});
