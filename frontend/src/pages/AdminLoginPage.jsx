import React, { useState, useEffect } from 'react';
import { Lock, User, AlertCircle, KeyRound, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/eglise.png';
import { API_BASE_URL } from '../config';

export default function AdminLoginPage({ setActiveTab }) {
  const { login } = useAuth();
  
  // Navigation / Workflow step: 'login' | 'change_password'
  const [step, setStep] = useState('login');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Temporary session during password change
  const [tempToken, setTempToken] = useState(null);
  const [tempUser, setTempUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lockout Timer State (30 Seconds)
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
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

      if (res.ok && data.token) {
        const userMustChange = data.user?.must_change_password || password === '123456';
        
        if (userMustChange) {
          // Mandatory First Login Password Change Step
          setTempToken(data.token);
          setTempUser(data.user);
          setStep('change_password');
          setSuccessMsg('Première connexion détectée : Veuillez choisir votre nouveau mot de passe personnel.');
        } else {
          // Normal login
          login(data.token, data.user);
          if (setActiveTab) setActiveTab('admin');
        }
      } else {
        setErrorMsg(data.message || 'Nom d\'utilisateur ou mot de passe incorrect.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Impossible de contacter le serveur backend Flask.');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Veuillez saisir et me confirmer le nouveau mot de passe.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Les deux mots de passe ne correspondent pas. Veuillez réessayer.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (newPassword === '123456') {
      setErrorMsg('Vous ne pouvez pas réutiliser le mot de passe par défaut 123456. Choisissez un nouveau mot de passe personnel.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        // Password changed successfully, complete login
        login(tempToken, data.user);
        if (setActiveTab) setActiveTab('admin');
      } else {
        setErrorMsg(data.message || 'Échec de la modification du mot de passe.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Erreur lors de la mise à jour du mot de passe.');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '3.5rem 1.25rem' }}>
      <div style={{ maxWidth: '460px', margin: '0 auto' }}>
        
        <div className="card" style={{ padding: '2.5rem 2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src={logoImg} alt="Logo Temple Bethesda" style={{ height: '75px', objectFit: 'contain', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.45rem', color: '#0F172A', marginBottom: '0.25rem', fontWeight: 700 }}>
              {step === 'login' ? "Portail d'Authentification" : "Modification du Mot de Passe"}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
              {step === 'login' ? "Temple Bethesda de Yopougon Niangon Sud" : `Compte : ${tempUser?.full_name || username}`}
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
              ⏳ Accès temporairement bloqué.<br/>
              <span style={{ fontSize: '1.1rem', color: '#DC2626' }}>Réessayez dans {lockoutTimer} seconde(s)</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#F0FDF4',
              border: '1px solid #86EFAC',
              color: '#166534',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              lineHeight: 1.4
            }}>
              <CheckCircle2 size={20} color="#16A34A" style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
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
              gap: '0.5rem',
              lineHeight: 1.4
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Username & Password Form */}
          {step === 'login' && (
            <form onSubmit={handleCredentialsSubmit}>
              
              <div className="form-group">
                <label className="form-label">Identifiant</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} color="#64748B" style={{ position: 'absolute', left: '12px' }} />
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ex: leonceaka"
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
                {loading ? "Connexion..." : "Connexion"}
              </button>

            </form>
          )}

          {/* Step 2: First-time Password Change Form */}
          {step === 'change_password' && (
            <form onSubmit={handleChangePasswordSubmit}>
              
              <div style={{
                padding: '0.85rem 1rem',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.83rem',
                color: '#1E40AF',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <ShieldAlert size={20} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Première Connexion Obligatoire :</strong><br/>
                  Veuillez remplacer le mot de passe générique par un nouveau mot de passe personnel d'au moins 6 caractères.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nouveau mot de passe</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <KeyRound size={18} color="#64748B" style={{ position: 'absolute', left: '12px' }} />
                  <input 
                    type="password" 
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Saisissez votre nouveau mot de passe"
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmer le nouveau mot de passe</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <KeyRound size={18} color="#64748B" style={{ position: 'absolute', left: '12px' }} />
                  <input 
                    type="password" 
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez à nouveau votre mot de passe"
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.85rem' }}
              >
                {loading ? "Enregistrement en cours..." : "Enregistrer et accéder au tableau de bord"}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
