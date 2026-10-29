import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './app/App.jsx';
import { legacyHashUrl, routerBasename } from './lib/routing.js';
import './styles/global.css';

const base = import.meta.env.BASE_URL;
const legacyTarget = legacyHashUrl(window.location, base);
if (legacyTarget) {
  // A full navigation loads the matching pre-rendered HTML before hydration.
  window.location.replace(legacyTarget);
} else {
  const root = document.getElementById('root');
  const app = <React.StrictMode>
    <BrowserRouter basename={routerBasename(base)}><App /></BrowserRouter>
  </React.StrictMode>;
  if (root.hasChildNodes()) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
