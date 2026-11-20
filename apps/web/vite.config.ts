import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The teacher app renders shared student game components for projector mode.
// Serve their public atlas alongside the teacher bundle as well.
export default defineConfig({ plugins: [react()], publicDir: '../student/public' });
