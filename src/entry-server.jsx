import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './app/App.jsx';
import { pageDescription, pageTitle } from './app/routes.js';
import { deployedPath, routerBasename } from './lib/routing.js';

export function render(path) {
  const base = import.meta.env.BASE_URL;
  return {
    title: pageTitle(path),
    description: pageDescription(path),
    body: renderToString(<React.StrictMode>
      <StaticRouter basename={routerBasename(base)} location={deployedPath(path, base)}><App /></StaticRouter>
    </React.StrictMode>),
  };
}
