import React from 'react';
import { createRoot } from 'react-dom/client';
import IndexPage from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IndexPage />
  </React.StrictMode>,
);
