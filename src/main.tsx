import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.tsx';

console.log(
  `${import.meta.env.VITE_APP_NAME} v${import.meta.env.VITE_APP_VERSION} ` +
    `git-${import.meta.env.VITE_GIT_BRANCH}-${import.meta.env.VITE_GIT_REVISION} ` +
    `build at ${import.meta.env.VITE_BUILD_TIME}`
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
