// Safely patch window.fetch to be writable to support custom wrappers/polyfills in the iframe sandbox
(function() {
  try {
    const originalFetch = window.fetch;
    if (originalFetch) {
      Object.defineProperty(window, "fetch", {
        value: originalFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {
    console.warn("Could not make window.fetch writable, trying prototype patch:", e);
    try {
      let customFetch = window.fetch;
      Object.defineProperty(Window.prototype, "fetch", {
        get() {
          return customFetch;
        },
        set(val) {
          customFetch = val;
        },
        configurable: true,
        enumerable: true
      });
    } catch (err2) {
      console.warn("Could not patch Window.prototype.fetch:", err2);
    }
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
