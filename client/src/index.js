import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// התמודדות גלובלית עם שגיאות ResizeObserver
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args.length > 0 && typeof args[0] === 'string' && (
    args[0].includes('ResizeObserver') || 
    args[0].includes('ResizeObserver loop completed') ||
    args[0].includes('ResizeObserver loop limit exceeded')
  )) {
    return;
  }
  originalConsoleError(...args);
};

// הוספת טיפול בשגיאות ברמת המסמך
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event && event.message && event.message.includes('ResizeObserver')) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return false;
    }
  }, true);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
        <ToastContainer
          position="top-left"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
); 