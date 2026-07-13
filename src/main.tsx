import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and suppress Firebase Quota errors to prevent them from crashing the AI Studio preview

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const hasQuotaError = args.some(arg => {
    if (typeof arg === 'string') {
      return arg.includes('resource-exhausted') || arg.includes('Quota limit exceeded') || arg.includes('Quota') || arg.includes('maximum backoff delay') || arg.includes('maximum backoff delay');
    }
    if (arg instanceof Error) {
      return arg.message.includes('resource-exhausted') || arg.message.includes('Quota limit exceeded') || arg.message.includes('Quota') || arg.message.includes('maximum backoff delay');
    }
    if (arg && typeof arg === 'object' && arg.code === 'resource-exhausted') {
      return true;
    }
    return false;
  });

  if (hasQuotaError) {
    return;
  }
  originalConsoleWarn(...args);
};

const originalConsoleError = console.error;
console.error = (...args) => {
  const hasQuotaError = args.some(arg => {
    if (typeof arg === 'string') {
      return arg.includes('resource-exhausted') || arg.includes('Quota limit exceeded') || arg.includes('Quota') || arg.includes('maximum backoff delay');
    }
    if (arg instanceof Error) {
      return arg.message.includes('resource-exhausted') || arg.message.includes('Quota limit exceeded') || arg.message.includes('Quota');
    }
    if (arg && typeof arg === 'object' && arg.code === 'resource-exhausted') {
      return true;
    }
    return false;
  });

  if (hasQuotaError) {
    if (!(window as any).__quotaAlertShown) {
      alert("عذراً، تم الوصول إلى الحد الأقصى المجاني لقاعدة البيانات (Quota Exceeded). بعض الميزات قد لا تعمل حالياً حتى يتم تجديد الباقة غداً.");
      (window as any).__quotaAlertShown = true;
    }
    return;
  }
  originalConsoleError(...args);
};


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
