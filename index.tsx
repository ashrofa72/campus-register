import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* FIX: Wrap the App component with AuthProvider to provide the required 'children' prop and make the auth context available to the entire application. */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);