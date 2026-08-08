import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

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
      path.resolve(import.meta.dirname, 'dist/version.json'),
      JSON.stringify({ version: longVersion, timestamp: buildTime })
    );
  },
};

const removeSample = {
  name: 'remove-sample',
  closeBundle() {
    if (gitInfo.branch === 'main') {
      const dir = path.resolve(import.meta.dirname, 'dist/sample');
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
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: {
        name: 'My Ideals',
        short_name: 'My Ideals',
        description: 'Track your Namashashin collections',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/favicon/192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/favicon/512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          {
            src: '/favicon/1024.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/sample/**'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // User-provided template JSON files, favor freshness over cache.
            urlPattern: ({ url, sameOrigin }) => url.pathname.endsWith('.json') && !sameOrigin,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'my-ideals-templates-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 128,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Images from the template json, cache first
            urlPattern: ({ url }) => /\.(?:png|jpe?g|webp|gif|svg)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'my-ideals-images-cache',
              expiration: {
                maxEntries: 8192,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '#': path.resolve(import.meta.dirname, './'),
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
