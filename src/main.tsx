import React from 'react';
import ReactDOM from 'react-dom/client';
// Ändring 1: Importera HashRouter från react-router-dom
import { HashRouter } from 'react-router-dom'; 
import App from './App';
import './index.css';
import './i18n'; // Import i18n configuration

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Ändring 2: Omslut <App /> med <HashRouter> */}
    <HashRouter> 
      <App />
    </HashRouter>
  </React.StrictMode>,
);