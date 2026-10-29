import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { normalizeBase } from './src/lib/routing.js';

// Organization site: https://mlb-lab.github.io/.
// For a project site, explicitly set VITE_BASE_PATH=/<repository>/.
export default defineConfig({
  plugins: [react()],
  base: normalizeBase(process.env.VITE_BASE_PATH || '/'),
});
