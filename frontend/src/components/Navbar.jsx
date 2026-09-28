import React, { useState } from 'react';
import { Church, FileText, Search, ShieldCheck, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/eglise.png';

export default function Navbar({ activeTab, setActiveTab }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const getRoleTitle = () => {
    if (!user) return '';
    if (user.role === 'secretariat') return 'Secrétariat';
    if (user.role === 'president_conducteur' || user.role === 'president') return 'Président des conducteurs';
    return user.full_name || user.username;
  };

  return (
    <header style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px' }}>
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => handleNav('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
        >
          <img 
            src={logoImg} 
            alt="Logo Église Méthodiste" 
            style={{ height: '54px', objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', color: '#107C41', lineHeight: 1.2 }}>
              TEMPLE BÉTHESDA
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
              Yopougon Niangon Sud • Circuit de Niangon
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => handleNav('home')}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontWeight: 600,
              color: activeTab === 'home' ? '#107C41' : '#475569',
              backgroundColor: activeTab === 'home' ? '#E6F4EA' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Church size={18} /> Accueil
          </button>

          <button 
            onClick={() => handleNav('submit')}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontWeight: 600,
              color: activeTab === 'submit' ? '#107C41' : '#475569',
              backgroundColor: activeTab === 'submit' ? '#E6F4EA' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <FileText size={18} /> Soumettre une Fiche
          </button>

          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', paddingLeft: '0.75rem', borderLeft: '1px solid #E2E8F0', flexShrink: 0 }}>
              <button 
                onClick={() => handleNav('admin')}
                className="btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ShieldCheck size={16} /> {getRoleTitle()}
              </button>
              <button 
                onClick={logout}
                title="Déconnexion"
                style={{
                  padding: '0.55rem',
                  borderRadius: '8px',
                  backgroundColor: '#F1F5F9',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button 
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#0F172A' }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <button 
            onClick={() => handleNav('home')}
            style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: activeTab === 'home' ? '#107C41' : '#475569' }}
          >
            Accueil
          </button>
          <button 
            onClick={() => handleNav('submit')}
            style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: activeTab === 'submit' ? '#107C41' : '#475569' }}
          >
            Soumettre une Fiche
          </button>
          {isAuthenticated && (
            <>
              <button 
                onClick={() => handleNav('admin')}
                style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#107C41' }}
              >
                Statistiques ( {getRoleTitle()} )
              </button>
              <button 
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#EF4444' }}
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
      )}

      {/* Responsive Inline CSS for Navbar Toggle */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
}
