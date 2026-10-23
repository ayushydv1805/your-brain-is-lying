import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AuthGate from './components/AuthGate.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthGate>
        <App />
      </AuthGate>
    </ErrorBoundary>
  </StrictMode>,
);

if (import.meta.env.PROD && (location.protocol === 'http:' || location.protocol === 'https:') && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      // Core gameplay still works without offline caching.
      console.warn('Offline support could not be enabled:', error);
    });
  }, { once: true });
}
