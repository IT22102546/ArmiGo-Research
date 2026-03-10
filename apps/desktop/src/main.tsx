import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Detect Electron production: check exposed API or file:// protocol
const isElectronProd = !!(window as any).electronAPI && !import.meta.env.DEV;
const isFileProtocol = window.location.protocol === 'file:';
const useHashRouter = isElectronProd || isFileProtocol;

const Router = useHashRouter ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);