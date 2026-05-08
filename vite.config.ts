import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { visualizer } from 'rollup-plugin-visualizer';

const getGitInfo = () => {
  try {
    return {
      branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      hash:
        execSync('git rev-parse --short HEAD').toString().trim() +
        (execSync('git status --porcelain').toString().trim().length ? '-dirty' : ''),
    };
  } catch {
    return { branch: 'unknown', hash: 'unknown' };
  }
};
const gitInfo = getGitInfo();

const removeSample = {
  name: 'remove-sample',
  closeBundle() {
    const branch = process.env.CF_PAGES ? process.env.CF_PAGES_BRANCH : gitInfo.branch;
    if (branch === 'main') {
      const dir = path.resolve(__dirname, 'dist/sample');
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log('Removed sample files from production build');
      }
    }
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      open: false,
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
    removeSample,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#': path.resolve(__dirname, './'),
    },
  },
  define: {
    'import.meta.env.VITE_APP_NAME': JSON.stringify(process.env.npm_package_name || ''),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '0.0.0'),
    'import.meta.env.VITE_GIT_BRANCH': JSON.stringify(gitInfo.branch),
    'import.meta.env.VITE_GIT_REVISION': JSON.stringify(gitInfo.hash),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'lib';
          }
        },
      },
    },
  },
});
