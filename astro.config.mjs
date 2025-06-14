// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    define: {
      // Server-side environment variables
      'import.meta.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
      'import.meta.env.SUPABASE_KEY': JSON.stringify(process.env.SUPABASE_KEY),
      'import.meta.env.MOCK_AUTH': JSON.stringify(process.env.MOCK_AUTH),
      // Client-side PUBLIC_ versions
      'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
      'import.meta.env.PUBLIC_SUPABASE_KEY': JSON.stringify(process.env.SUPABASE_KEY),
      'import.meta.env.PUBLIC_MOCK_AUTH': JSON.stringify(process.env.MOCK_AUTH),
    },
  },
  adapter: node({
    mode: "standalone",
  }),
  experimental: {
    session: true,
  },
});
