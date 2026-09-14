import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, Smartphone, KeyRound, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/eglise.png';
import { API_BASE_URL } from '../config';

export default function AdminLoginPage({ setActiveTab }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP state
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lockout Timer State (30 Seconds)
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    // Check localStorage for active lockout
    const storedLockout = localStorage.getItem('bethesda_otp_lockout_until');
    if (storedLockout) {
      const remaining = Math.ceil((parseInt(storedLockout, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutTimer(remaining);
      } else {
        localStorage.removeItem('bethesda_otp_lockout_until');
      }
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('bethesda_otp_lockout_until');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const triggerLockout = (seconds = 30) => {
    const unlockTime = Date.now() + seconds * 1000;
    localStorage.setItem('bethesda_otp_lockout_until', unlockTime.toString());
    setLockoutTimer(seconds);
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password })
      });
      const data = await res.json();
      setLoading(false);

      if (res.status === 429) {
        const sec = data.blocked_for_seconds || 30;
        triggerLockout(sec);
        setErrorMsg(data.message || '5 tentatives infructueuses. Compte bloqué pendant 30 secondes.');
        return;
      }

      if (res.ok && data.require_otp) {
        setRequireOtp(true);
        setPhoneMasked(data.phone_masked || '...36994');
        setSuccessMsg(data.message || 'Code OTP à 4 chiffres envoyé par SMS.');
      } else {
        setErrorMsg(data.message || 'Nom d\'utilisateur ou mot de passe incorrect.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Impossible de contacter le serveur backend Flask.');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), otp_code: otpCode.trim() })
      });
      const data = await res.json();
      setLoading(false);

      if (res.status === 429) {
        const sec = data.blocked_for_seconds || 30;
        triggerLockout(sec);
        setErrorMsg(data.message || '5 tentatives échouées. Compte bloqué pendant 30 secondes.');
        return;
      }

      if (res.ok) {
        login(data.token, data.user);
        if (setActiveTab) setActiveTab('admin');
      } else {
        setErrorMsg(data.message || 'Code OTP incorrect.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Erreur réseau lors de la vérification OTP.');
    }
  };

  const handleResendOtp = async () => {
    if (lockoutTimer > 0) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase() })
      });
      const data = await res.json();
      setLoading(false);

      if (res.status === 429) {
        const sec = data.blocked_for_seconds || 30;
        triggerLockout(sec);
        setErrorMsg(data.message);
      } else if (res.ok) {
        setSuccessMsg('Un nouveau code OTP à 4 chiffres a été envoyé par SMS.');
      } else {
        setErrorMsg(data.message || 'Erreur lors du renvoi de l\'OTP.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Erreur de communication avec le serveur.');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '3.5rem 1.25rem' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        
        <div className="card" style={{ padding: '2.5rem 2rem' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src={logoImg} alt="Logo Temple Bethesda" style={{ height: '70px', objectFit: 'contain', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.45rem', color: '#0F172A', marginBottom: '0.25rem' }}>
              Portail d'Authentification
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Temple Bethesda de Yopougon Niangon Sud
            </p>
          </div>

          {/* Lockout Warning Banner */}
          {lockoutTimer > 0 && (
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              color: '#991B1B',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              fontSize: '0.88rem',
              textAlign: 'center',
              fontWeight: 600
            }}>
              ⏳ Accès temporairement bloqué suite à 5 échecs.<br/>
              <span style={{ fontSize: '1.1rem', color: '#DC2626' }}>Réessayez dans {lockoutTimer} seconde(s)</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && !errorMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#E6F4EA',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.88rem'
            }}>
              ✅ {successMsg}
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Username & Password Form */}
          {!requireOtp ? (
            <form onSubmit={handleCredentialsSubmit}>
              
              <div className="form-group">
                <label className="form-label">Identifiant (Nom & Prénom collés)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} color="#64748B" style={{ position: 'absolute', left: '12px' }} />
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ex: leonceaka ou yedohjosephine"
                    disabled={lockoutTimer > 0 || loading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} color="#64748B" style={{ position: 'absolute', left: '12px' }} />
                  <input 
                    type="password" 
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={lockoutTimer > 0 || loading}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || lockoutTimer > 0}
                style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.85rem' }}
              >
                {loading ? "Vérification..." : "Continuer vers Vérification OTP"}
              </button>

            </form>
          ) : (
            
            /* STEP 2: 4-Digit OTP Form */
            <form onSubmit={handleOtpSubmit}>
              
              <div style={{
                padding: '1rem',
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <Smartphone size={32} color="#107C41" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
                  Code de Sécurité OTP (4 chiffres)
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
                  Un code SMS a été envoyé au num : <strong>+2250708729293</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                  Saisissez le code OTP à 4 chiffres
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <KeyRound size={20} color="#107C41" style={{ position: 'absolute', left: '14px' }} />
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ 
                      paddingLeft: '44px', 
                      letterSpacing: '8px', 
                      fontSize: '1.3rem', 
                      fontWeight: 800, 
                      textAlign: 'center' 
                    }}
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    disabled={lockoutTimer > 0 || loading}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || lockoutTimer > 0 || otpCode.length < 4}
                style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem', padding: '0.85rem' }}
              >
                {loading ? "Vérification OTP..." : "Valider et Accéder à la Plateforme"}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                <button 
                  type="button" 
                  onClick={() => setRequireOtp(false)}
                  style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  ← Modifier l'identifiant
                </button>

                <button 
                  type="button" 
                  onClick={handleResendOtp}
                  disabled={lockoutTimer > 0 || loading}
                  style={{ background: 'none', border: 'none', color: '#107C41', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={13} /> Renvoyer le SMS
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}

