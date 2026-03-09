import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Check if running in Electron production
const isElectron = !!(window as any).electron;
const isDev = import.meta.env.DEV;
const useHashRouter = isElectron && !isDev;

const Router = useHashRouter ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);