import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.tsx';
import { APP_NAME, LONG_VERSION, BUILD_TIME_RAW, MODE } from './utils/appInfo.ts';
import { bootstrap } from './bootstrap.ts';

console.log(`${APP_NAME} ${LONG_VERSION} (${MODE}) build at ${BUILD_TIME_RAW}`);

bootstrap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
