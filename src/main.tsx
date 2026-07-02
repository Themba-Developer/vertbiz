import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import './styles.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found: add <div id="root"></div> to index.html');

const router = getRouter();

createRoot(rootEl).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
