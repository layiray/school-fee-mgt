import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from './context/SessionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import Navbar from './components/Common/Navbar';
import ParentDashboard from './components/Parent/ParentDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import LoadingSpinner from './components/Common/LoadingSpinner';
import useIdleTimeout from './hooks/useIdleTimeout';
import { createAdminUser } from './config/firebase';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login');

  // Auto logout after 5 minutes of inactivity (only when logged in)
  useIdleTimeout(5);

  // Create admin user on first load
  useEffect(() => {
    const setupAdmin = async () => {
      await createAdminUser();
    };
    setupAdmin();
  }, []);

  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    switch(authMode) {
      case 'register':
        return <Register onSwitchToLogin={() => setAuthMode('login')} />;
      case 'forgot':
        return <ForgotPassword onBackToLogin={() => setAuthMode('login')} />;
      default:
        return (
          <Login 
            onSwitchToRegister={() => setAuthMode('register')}
            onSwitchToForgotPassword={() => setAuthMode('forgot')}
          />
        );
    }
  }
  
  return (
    <>
      <Navbar />
      {user.role === 'admin' ? <AdminDashboard /> : <ParentDashboard />}
    </>
  );
};

function App() {
  return (
    <SessionProvider>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <AppContent />
      </AuthProvider>
    </SessionProvider>
  );
}

export default App;