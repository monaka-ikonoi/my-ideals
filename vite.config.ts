import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { visualizer } from 'rollup-plugin-visualizer';

const getGitInfo = () => {
  try {
    if (process.env.CF_PAGES) {
      return {
        branch: process.env.CF_PAGES_BRANCH,
        hash: process.env.CF_PAGES_COMMIT_SHA!.slice(0, 7),
      };
    }
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
const longVersion = `v${process.env.npm_package_version} git-${gitInfo.branch}-${gitInfo.hash}`;
const buildTime = new Date().valueOf();

const writeVersion = {
  name: 'write-version',
  closeBundle() {
    fs.writeFileSync(
      path.resolve(__dirname, 'dist/version.json'),
      JSON.stringify({ version: longVersion, timestamp: buildTime })
    );
  },
};

const removeSample = {
  name: 'remove-sample',
  closeBundle() {
    if (gitInfo.branch === 'main') {
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
    writeVersion,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#': path.resolve(__dirname, './'),
    },
  },
  define: {
    'import.meta.env.VITE_APP_NAME': JSON.stringify(process.env.npm_package_name),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
    'import.meta.env.VITE_GIT_BRANCH': JSON.stringify(gitInfo.branch),
    'import.meta.env.VITE_GIT_HASH': JSON.stringify(gitInfo.hash),
    'import.meta.env.VITE_LONG_VERSION': JSON.stringify(longVersion),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'vendor-react';
          }
          if (id.includes('/i18next') || id.includes('/react-i18next/')) {
            return 'vendor-i18n';
          }
          if (id.includes('/react-virtuoso/')) {
            return 'vendor-virtuoso';
          }
          if (id.includes('/html-to-image/')) {
            return 'vendor-html-to-image';
          }
          return 'vendor-misc';
        },
      },
    },
  },
});
