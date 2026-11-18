import { defineConfig } from "vitest/config";

// Vitest ejecuta únicamente los tests fuente. `dist` contiene JavaScript
// compilado para producción y nunca debe volver a descubrirse como test.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
    // Los tests de integración comparten una base PostgreSQL y cada uno
    // limpia sus tablas; ejecutarlos en paralelo provocaría carreras.
    fileParallelism: false,
  },
});
