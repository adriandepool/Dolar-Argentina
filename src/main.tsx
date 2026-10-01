import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar Service Worker para PWA (instalable en móviles y escritorio)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('Service Worker registrado con éxito:', reg.scope);
      })
      .catch(err => {
        console.warn('Error al registrar Service Worker:', err);
      });
  });
}
