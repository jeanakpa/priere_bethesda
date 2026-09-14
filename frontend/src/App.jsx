import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SubmitFormPage from './pages/SubmitFormPage';
import TrackFormPage from './pages/TrackFormPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [trackingCodeParam, setTrackingCodeParam] = useState('');
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    const handleLocationRoute = () => {
      const hash = window.location.hash.replace('#', '').replace('/', '').toLowerCase();
      const path = window.location.pathname.replace('/', '').toLowerCase();
      const route = hash || path;
      if (route === 'login' || route === 'admin' || route === 'secretariat') {
        setActiveTab('login');
      } else if (route === 'submit') {
        setActiveTab('submit');
      } else if (route === 'track') {
        setActiveTab('track');
      }
    };

    handleLocationRoute();
    window.addEventListener('hashchange', handleLocationRoute);
    window.addEventListener('popstate', handleLocationRoute);
    return () => {
      window.removeEventListener('hashchange', handleLocationRoute);
      window.removeEventListener('popstate', handleLocationRoute);
    };
  }, []);

  const handleTrackCodeSelect = (code) => {
    setTrackingCodeParam(code);
    setActiveTab('track');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      
      {/* Navbar Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Area with Mandatory Login Gate */}
      <main style={{ flex: 1 }}>
        {!isAuthenticated ? (
          <AdminLoginPage setActiveTab={setActiveTab} />
        ) : activeTab === 'submit' ? (
          <SubmitFormPage setActiveTab={setActiveTab} onTrackCodeSelect={handleTrackCodeSelect} />
        ) : (
          <AdminDashboardPage />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print" style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        padding: '2rem 1.25rem',
        marginTop: 'auto',
        textAlign: 'center',
        color: '#64748B',
        fontSize: '0.88rem'
      }}>
        <div className="container">
          <div style={{ fontWeight: 700, color: '#107C41', fontSize: '1rem', marginBottom: '0.25rem' }}>
            Église Méthodiste de Côte d'Ivoire
          </div>
          <div>District de Yopougon – Circuit Niangon • Temple Bethesda de Yopougon Niangon Sud</div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#94A3B8' }}>
            © 2026 Temple Bethesda. Tous droits réservés.
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
