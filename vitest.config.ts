import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    coverage: {
      exclude: [
        '**/*.module.ts', // configuración de Nest
        '**/dto/**', // sus decoradores los ejecuta el ValidationPipe (pruebas e2e)
        '**/entities/**', // sus decoradores los ejecuta TypeORM al conectarse
        'src/main.ts', // arranque de la aplicación
      ],
    },
  },
});
