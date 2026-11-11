import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Keep Firebase Auth/Firestore and their @firebase dependencies together.
          if (id.includes('/node_modules/firebase/') || id.includes('/node_modules/@firebase/')) {
            return 'vendor-firebase';
          }
          if (id.includes('/node_modules/lucide-react/')) return 'vendor-lucide';
          if (id.includes('/node_modules/canvas-confetti/')) return 'vendor-confetti';
          return undefined;
        },
      },
    },
  },
});
