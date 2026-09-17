import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // "server-only" throws when imported outside a React Server Component
      // bundler context (which vitest isn't). We only ever import
      // server-only modules here for pure-logic unit testing, so stub it.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.js"),
    },
  },
  test: {
    environment: "node",
  },
});
