import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      spa: {
        enabled: true,
      },
      server: {
        entry: "src/server.ts",
      },
    }),
    react(),
    tsconfigPaths(),
    nitro({
      preset: "vercel",
    }),
  ],
});

