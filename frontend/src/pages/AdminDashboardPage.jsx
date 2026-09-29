import React, { useState, useEffect } from 'react';
import { 
  BarChart3, FileText, CheckCircle2, AlertCircle, Download, Printer, 
  Search, Filter, RefreshCw, Eye, Trash2, ShieldCheck, HeartHandshake, Baby, Calendar, Layers,
  Users, KeyRound, Lock, EyeOff, Check, X, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PrintableFormModal from '../components/PrintableFormModal';
import { API_BASE_URL } from '../config';

export default function AdminDashboardPage() {
  const { token, user, logout } = useAuth();
  
  // Dashboard Tabs: 'fiches' | 'users'
  const [activeAdminTab, setActiveAdminTab] = useState('fiches');

  // Stats & Requests State
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [formTypeFilter, setFormTypeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [receptionStart, setReceptionStart] = useState('');
  const [receptionEnd, setReceptionEnd] = useState('');

  // Selected request for printable preview modal
  const [selectedReqForModal, setSelectedReqForModal] = useState(null);

  // User Management State for Secretariat (Léonce AKA)
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [unlockedUsers, setUnlockedUsers] = useState(false);
  const [confirmedSecPass, setConfirmedSecPass] = useState('');
  
  // Gate Confirmation Modal State
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [gatePasswordInput, setGatePasswordInput] = useState('');
  const [gateError, setGateError] = useState('');
  const [gateLoading, setGateLoading] = useState(false);

  // Password Reset Modal State
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [secConfirmPasswordInput, setSecConfirmPasswordInput] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Toggle reveal password for specific user ID
  const [revealedUsersMap, setRevealedUsersMap] = useState({});

  useEffect(() => {
    fetchStats();
    fetchRequests();
  }, [formTypeFilter, classFilter, statusFilter, receptionStart, receptionEnd]);

  useEffect(() => {
    if (activeAdminTab === 'users' && user?.role === 'secretariat') {
      if (!unlockedUsers) {
        setGateModalOpen(true);
      } else {
        fetchUsers(confirmedSecPass);
      }
    }
  }, [activeAdminTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Erreur stats:", err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    let url = new URL(`${API_BASE_URL}/api/admin/requests`);
    if (formTypeFilter) url.searchParams.append('form_type', formTypeFilter);
    if (classFilter) url.searchParams.append('methode_classe', classFilter);
    if (statusFilter) url.searchParams.append('status', statusFilter);
    if (searchQuery) url.searchParams.append('search', searchQuery);
    if (receptionStart) url.searchParams.append('reception_start', receptionStart);
    if (receptionEnd) url.searchParams.append('reception_end', receptionEnd);

    try {
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        setRequests(data.requests);
        setTotal(data.total);
      }
    } catch (err) {
      setLoading(false);
      console.error("Erreur chargement fiches:", err);
    }
  };

  const fetchUsers = async (secPass = '') => {
    setUsersLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      if (secPass) headers['X-Secretary-Password'] = secPass;

      const res = await fetch(`${API_BASE_URL}/api/admin/users`, { headers });
      const data = await res.json();
      setUsersLoading(false);
      if (res.ok) {
        setUsersList(data.users);
        setUnlockedUsers(data.unlocked);
      }
    } catch (err) {
      setUsersLoading(false);
      console.error("Erreur chargement utilisateurs:", err);
    }
  };

  const handleGatePasswordSubmit = async (e) => {
    e.preventDefault();
    setGateError('');
    setGateLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: gatePasswordInput })
      });
      const data = await res.json();
      setGateLoading(false);

      if (res.ok) {
        setConfirmedSecPass(gatePasswordInput);
        setUnlockedUsers(true);
        setGateModalOpen(false);
        fetchUsers(gatePasswordInput);
      } else {
        setGateError(data.message || "Mot de passe du Secrétariat incorrect.");
      }
    } catch (err) {
      setGateLoading(false);
      setGateError("Impossible de contacter le serveur backend.");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!newPasswordInput) {
      setResetError("Veuillez saisir le nouveau mot de passe.");
      return;
    }

    if (newPasswordInput.length < 8) {
      setResetError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    if (!/[A-Z]/.test(newPasswordInput)) {
      setResetError("Le mot de passe doit contenir au moins une lettre majuscule (A-Z).");
      return;
    }
    if (!/[a-z]/.test(newPasswordInput)) {
      setResetError("Le mot de passe doit contenir au moins une lettre minuscule (a-z).");
      return;
    }
    if (!/[0-9]/.test(newPasswordInput)) {
      setResetError("Le mot de passe doit contenir au moins un chiffre (0-9).");
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPasswordInput)) {
      setResetError("Le mot de passe doit contenir au moins un symbole spécial (ex: @, #, !, $, %).");
      return;
    }
    if (newPasswordInput === '123456') {
      setResetError("Vous ne pouvez pas réutiliser le mot de passe par défaut 123456.");
      return;
    }

    if (!secConfirmPasswordInput) {
      setResetError("Veuillez saisir votre propre mot de passe du Secrétariat pour valider.");
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUserForReset.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sec_password: secConfirmPasswordInput,
          new_password: newPasswordInput
        })
      });
      const data = await res.json();
      setResetLoading(false);

      if (res.ok) {
        setResetSuccess(data.message);
        fetchUsers(confirmedSecPass || secConfirmPasswordInput);
        setTimeout(() => {
          setSelectedUserForReset(null);
          setNewPasswordInput('');
          setSecConfirmPasswordInput('');
          setResetSuccess('');
        }, 1800);
      } else {
        setResetError(data.message || "Échec de la réinitialisation du mot de passe.");
      }
    } catch (err) {
      setResetLoading(false);
      setResetError("Erreur lors de la communication avec le serveur.");
    }
  };

  const toggleRevealPassword = (userId) => {
    setRevealedUsersMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleStatusUpdate = async (reqId, newStatus, isValidated) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/requests/${reqId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, is_validated: isValidated })
      });
      if (res.ok) {
        fetchRequests();
        fetchStats();
      }
    } catch (err) {
      alert("Erreur mise a jour statut.");
    }
  };

  const handleDelete = async (reqId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette fiche ?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/requests/${reqId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRequests();
        fetchStats();
      }
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const getFormTitle = (type) => {
    switch (type) {
      case 'NECROLOGIE': return 'Nécrologie';
      case 'DEMANDE_PRIERE': return 'Prière';
      case 'PRESENTATION_ENFANT': return 'Présentation Enfant';
      case 'REUNION_CLASSE': return 'Réunion de Classe';
      default: return type;
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', padding: '2rem 2rem 5rem 2rem' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <span className="badge badge-success" style={{ marginBottom: '0.4rem' }}>
            <ShieldCheck size={14} style={{ marginRight: '4px' }} /> {
              user?.role === 'secretariat' ? "SECRÉTARIAT D'ÉGLISE" :
              (user?.role === 'president_conducteur' || user?.role === 'president') ? "PRÉSIDENT DES CONDUCTEURS" :
              user?.full_name || "CONDUCTEUR"
            }
          </span>
          <h1 style={{ fontSize: '1.9rem', color: '#0F172A' }}>
            {user?.role === 'secretariat' ? "Portail Administrateur - Temple Bethesda" : "Gestion des Fiches de Prière"}
          </h1>
        </div>

        <button onClick={logout} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          Déconnexion
        </button>
      </div>

      {/* Tabs Header for Secretariat */}
      {user?.role === 'secretariat' && (
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          borderBottom: '2px solid #E2E8F0',
          marginBottom: '2rem',
          paddingBottom: '0.25rem'
        }}>
          <button
            onClick={() => setActiveAdminTab('fiches')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              borderBottom: activeAdminTab === 'fiches' ? '3px solid #107C41' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeAdminTab === 'fiches' ? '#107C41' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FileText size={18} /> Répertoire des Fiches
          </button>

          <button
            onClick={() => setActiveAdminTab('users')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              borderBottom: activeAdminTab === 'users' ? '3px solid #107C41' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeAdminTab === 'users' ? '#107C41' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Users size={18} /> Gestion des Utilisateurs & Mots de Passe
          </button>
        </div>
      )}

      {/* TAB 1: REPERTOIRE DES FICHES */}
      {activeAdminTab === 'fiches' && (
        <>
          {/* Key Statistics Grid */}
          {stats && (
            <div style={{ marginBottom: '2.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                
                {/* Card Total */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #107C41' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>TOTAL DES FICHES</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>{stats.total}</div>
                </div>

                {/* Card Prières */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16A34A' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>DEMANDES DE PRIÈRE</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16A34A', marginTop: '0.2rem' }}>{stats.by_type.DEMANDE_PRIERE || 0}</div>
                </div>

                {/* Card Nécrologie */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #D97706' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>NÉCROLOGIES</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#D97706', marginTop: '0.2rem' }}>{stats.by_type.NECROLOGIE || 0}</div>
                </div>

                {/* Card Présentation */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #0284C7' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>PRÉSENTATIONS ENFANT</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0284C7', marginTop: '0.2rem' }}>{stats.by_type.PRESENTATION_ENFANT || 0}</div>
                </div>

                {/* Card Réunions */}
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #475569' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>RÉUNIONS DE CLASSE</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#475569', marginTop: '0.2rem' }}>{stats.by_type.REUNION_CLASSE || 0}</div>
                </div>

              </div>

              {/* Methodist Class Breakdown Statistics Table */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#107C41', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} /> Répartition des fiches par Classe Méthodiste
                </h3>
                
                {Object.keys(stats.by_class).length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Aucune classe méthodiste répertoriée pour l'instant.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {Object.entries(stats.by_class).map(([clsName, count]) => (
                      <div key={clsName} style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '0.6rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: user?.role === 'conducteur' ? 'default' : 'pointer'
                      }}
                      onClick={() => {
                        if (user?.role !== 'conducteur') setClassFilter(clsName);
                      }}
                      >
                        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>{clsName}</span>
                        <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>{count} fiches</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Multi-Criteria Filters Toolbar */}
          <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} color="#107C41" /> Filtres Avancés du Répertoire
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              
              {/* Filter 1: Form Type */}
              <div>
                <label className="form-label">Type de Fiche</label>
                <select className="form-control" value={formTypeFilter} onChange={(e) => setFormTypeFilter(e.target.value)}>
                  <option value="">-- Tous les types --</option>
                  <option value="DEMANDE_PRIERE">Demande de Prière</option>
                  <option value="NECROLOGIE">Nécrologie</option>
                  <option value="PRESENTATION_ENFANT">Présentation d'Enfant</option>
                  <option value="REUNION_CLASSE">Réunion de Classe</option>
                </select>
              </div>

              {/* Filter 2: Methodist Class (Hidden for Conducteur) */}
              {user?.role !== 'conducteur' && (
                <div>
                  <label className="form-label">Classe Méthodiste</label>
                  <select className="form-control" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                    <option value="">-- Toutes les classes --</option>
                    {stats?.available_classes?.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filter 3: Status */}
              <div>
                <label className="form-label">Statut</label>
                <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">-- Tous les statuts --</option>
                  <option value="Nouveau">Nouveau</option>
                  <option value="Validé">Validé par Secrétariat</option>
                  <option value="Traité">Traité</option>
                </select>
              </div>

              {/* Filter 4: Date Start */}
              <div>
                <label className="form-label">Du (Recherche Réception)</label>
                <input type="date" className="form-control" value={receptionStart} onChange={(e) => setReceptionStart(e.target.value)} />
              </div>

              {/* Filter 5: Date End */}
              <div>
                <label className="form-label">Au (Recherche Réception)</label>
                <input type="date" className="form-control" value={receptionEnd} onChange={(e) => setReceptionEnd(e.target.value)} />
              </div>

            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ paddingLeft: '38px' }} 
                  placeholder="Rechercher par Code Unique (ex: BET-2026-1001), Nom du demandeur, Conducteur..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                Rechercher
              </button>
              {(formTypeFilter || classFilter || statusFilter || searchQuery || receptionStart || receptionEnd) && (
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => {
                    setFormTypeFilter(''); setClassFilter(''); setStatusFilter(''); setSearchQuery(''); setReceptionStart(''); setReceptionEnd('');
                  }}
                >
                  Réinitialiser
                </button>
              )}
            </form>

          </div>

          {/* Requests Directory Table */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#0F172A' }}>
                Répertoire des Fiches ({total})
              </h3>
              <button onClick={fetchRequests} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>
                <RefreshCw size={14} /> Actualiser
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Chargement du répertoire...</div>
            ) : requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Aucune fiche trouvée avec les critères sélectionnés.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                      <th style={{ padding: '0.85rem' }}>Code Unique</th>
                      <th style={{ padding: '0.85rem' }}>Type Fiche</th>
                      <th style={{ padding: '0.85rem' }}>Classe Méthodiste</th>
                      <th style={{ padding: '0.85rem' }}>Demandeur / Sujet</th>
                      <th style={{ padding: '0.85rem' }}>Date Événement</th>
                      <th style={{ padding: '0.85rem' }}>Statut</th>
                      <th style={{ padding: '0.85rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        
                        <td style={{ padding: '0.85rem', fontWeight: 700, color: '#107C41' }}>
                          {req.tracking_code}
                        </td>
                        
                        <td style={{ padding: '0.85rem' }}>
                          {getFormTitle(req.form_type)}
                        </td>

                        <td style={{ padding: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{req.methode_classe || 'Non spécifiée'}</span><br/>
                          <small style={{ color: '#64748B' }}>{req.conducteur || ''}</small>
                        </td>

                        <td style={{ padding: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>{req.demandeur_nom}</span>
                          {req.details?.sujet && (
                            <div style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {req.details.sujet}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '0.85rem' }}>
                          {req.event_date || 'N/A'}
                        </td>

                        <td style={{ padding: '0.85rem' }}>
                          <span className={`badge ${
                            req.status === 'Validé' ? 'badge-success' : 
                            req.status === 'Nouveau' ? 'badge-warning' : 'badge-info'
                          }`}>
                            {req.status}
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            
                            {/* View / Print Preview Modal Trigger */}
                            <button 
                              onClick={() => setSelectedReqForModal(req)}
                              className="btn-secondary" 
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                              title="Aperçu Imprimable Officiel A4"
                            >
                              <Eye size={15} /> Aperçu A4
                            </button>

                            {/* Secretariat Validation Switch */}
                            {user?.role === 'secretariat' && (
                              <button 
                                onClick={() => handleStatusUpdate(req.id, req.status === 'Validé' ? 'Nouveau' : 'Validé', req.status !== 'Validé')}
                                className={req.status === 'Validé' ? 'btn-secondary' : 'btn-primary'}
                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                              >
                                {req.status === 'Validé' ? 'Dévalider' : 'Valider'}
                              </button>
                            )}

                            {/* Delete (Secretariat Only) */}
                            {user?.role === 'secretariat' && (
                              <button 
                                onClick={() => handleDelete(req.id)}
                                style={{ padding: '0.4rem 0.6rem', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '6px', cursor: 'pointer' }}
                                title="Supprimer"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </>
      )}

      {/* TAB 2: GESTION DES UTILISATEURS & MOTS DE PASSE (SECRÉTARIAT SEULEMENT) */}
      {activeAdminTab === 'users' && user?.role === 'secretariat' && (
        <div>
          <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} color="#107C41" /> Gestion des Comptes Conducteurs & Mots de Passe
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Espace confidentiel réservé au Secrétariat pour consulter les mots de passe actifs ou réinitialiser le mot de passe d'un conducteur en cas d'oubli.
                </p>
              </div>

              {!unlockedUsers ? (
                <button onClick={() => setGateModalOpen(true)} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  <Lock size={16} /> Confirmer mon mot de passe pour Déverrouiller
                </button>
              ) : (
                <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}>
                  🔓 Mode Secrétariat Déverrouillé
                </span>
              )}
            </div>

            {/* Users Table */}
            {usersLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Chargement des utilisateurs...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                      <th style={{ padding: '0.85rem' }}>Identifiant (`username`)</th>
                      <th style={{ padding: '0.85rem' }}>Nom Complet</th>
                      <th style={{ padding: '0.85rem' }}>Rôle</th>
                      <th style={{ padding: '0.85rem' }}>Classe Méthodiste</th>
                      <th style={{ padding: '0.85rem' }}>Statut Première Connexion</th>
                      <th style={{ padding: '0.85rem' }}>Mot de Passe Actuel</th>
                      <th style={{ padding: '0.85rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.85rem', fontWeight: 700, color: '#107C41' }}>
                          {u.username}
                        </td>
                        <td style={{ padding: '0.85rem', fontWeight: 600 }}>
                          {u.full_name}
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          <span className={`badge ${
                            u.role === 'secretariat' ? 'badge-success' :
                            u.role === 'president_conducteur' ? 'badge-warning' : 'badge-info'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          {u.methode_classe || '-'}
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          {u.must_change_password ? (
                            <span style={{ color: '#D97706', fontWeight: 600, fontSize: '0.82rem' }}>
                              ⚠️ À Modifier (123456)
                            </span>
                          ) : (
                            <span style={{ color: '#16A34A', fontWeight: 600, fontSize: '0.82rem' }}>
                              ✅ Modifié & Sécurisé
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          {unlockedUsers ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                backgroundColor: '#F1F5F9',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                color: revealedUsersMap[u.id] ? '#0F172A' : '#94A3B8'
                              }}>
                                {revealedUsersMap[u.id] ? (u.plain_password || '123456') : '••••••••'}
                              </span>
                              <button 
                                onClick={() => toggleRevealPassword(u.id)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', padding: '2px' }}
                                title={revealedUsersMap[u.id] ? "Masquer" : "Révéler le mot de passe"}
                              >
                                {revealedUsersMap[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.83rem' }}>
                              🔒 Entrez votre mot de passe pour voir
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              if (!unlockedUsers) {
                                setGateModalOpen(true);
                              } else {
                                setSelectedUserForReset(u);
                                setNewPasswordInput('');
                                setSecConfirmPasswordInput(confirmedSecPass);
                                setResetError('');
                                setResetSuccess('');
                              }
                            }}
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                          >
                            <KeyRound size={14} /> Modifier / Réinitialiser
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CONFIRMATION DU MOT DE PASSE DU SECRÉTARIAT (GATE) */}
      {gateModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <ShieldAlert size={28} color="#2563EB" />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#0F172A', fontWeight: 700 }}>
                Confirmation du Secrétariat
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.35rem' }}>
                Veuillez saisir le mot de passe du compte <strong>Léonce AKA (Secrétariat)</strong> pour déverrouiller l'accès confidentiel à la gestion des mots de passe.
              </p>
            </div>

            {gateError && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {gateError}
              </div>
            )}

            <form onSubmit={handleGatePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Votre Mot de passe Secrétariat</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} color="#64748B" style={{ position: 'absolute', left: '12px' }} />
                  <input 
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    value={gatePasswordInput}
                    onChange={(e) => setGatePasswordInput(e.target.value)}
                    placeholder="Saisissez votre mot de passe"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setGateModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={gateLoading} style={{ flex: 1, justifyContent: 'center' }}>
                  {gateLoading ? "Vérification..." : "Déverrouiller"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: RÉINITIALISATION DE MOT DE PASSE UTILISATEUR */}
      {selectedUserForReset && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#0F172A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} color="#107C41" /> Réinitialiser Mot de Passe
              </h3>
              <button onClick={() => setSelectedUserForReset(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.88rem' }}>
              <div><strong>Utilisateur :</strong> {selectedUserForReset.full_name}</div>
              <div><strong>Identifiant :</strong> <span style={{ color: '#107C41', fontWeight: 700 }}>{selectedUserForReset.username}</span></div>
              <div><strong>Classe :</strong> {selectedUserForReset.methode_classe || '-'}</div>
            </div>

            {resetSuccess && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                ✅ {resetSuccess}
              </div>
            )}

            {resetError && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                ⚠️ {resetError}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit}>
              
              <div className="form-group">
                <label className="form-label">Nouveau Mot de Passe Fort pour le Conducteur</label>
                <input 
                  type="text"
                  className="form-control"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="ex: Bethesda2026!"
                  required
                  minLength={8}
                />
                <small style={{ color: '#64748B', fontSize: '0.75rem', display: 'block', marginTop: '0.35rem' }}>
                  Exigences : 8+ caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 symbole.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmation Mot de Passe du Secrétariat (Pour Valider)</label>
                <input 
                  type="password"
                  className="form-control"
                  value={secConfirmPasswordInput}
                  onChange={(e) => setSecConfirmPasswordInput(e.target.value)}
                  placeholder="Saisissez votre mot de passe Secrétariat"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setSelectedUserForReset(null)} style={{ flex: 1, justifyContent: 'center' }}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={resetLoading} style={{ flex: 1, justifyContent: 'center' }}>
                  {resetLoading ? "Enregistrement..." : "Valider la Modification"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Printable Preview Modal */}
      {selectedReqForModal && (
        <PrintableFormModal 
          request={selectedReqForModal}
          onClose={() => setSelectedReqForModal(null)}
          token={token}
        />
      )}

    </div>
  );
}
