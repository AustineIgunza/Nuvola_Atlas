import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// SPA build for Vercel — no Laravel, no Inertia server needed
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            // Replace Inertia imports with our lightweight SPA shim
            '@inertiajs/react': path.resolve(__dirname, 'resources/js/lib/inertia-shim.tsx'),
        },
    },
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
