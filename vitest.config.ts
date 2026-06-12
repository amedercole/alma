import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Resolve the same `@/*` -> `src/*` alias used by the app. An explicit alias is
// used (rather than reading tsconfig paths) because tests live outside the
// tsconfig `include`.
const srcDir = fileURLToPath(new URL("./src/", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\/(.*)$/, replacement: `${srcDir}$1` }],
  },
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    // Vitest owns *.test.ts; Playwright owns *.spec.ts under tests/e2e.
    include: ["tests/**/*.test.ts"],
  },
});
