import React, { useState, useEffect } from 'react';
import { 
  BarChart3, FileText, CheckCircle2, AlertCircle, Download, Printer, 
  Search, Filter, RefreshCw, Eye, Trash2, ShieldCheck, HeartHandshake, Baby, Calendar, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PrintableFormModal from '../components/PrintableFormModal';
import { API_BASE_URL } from '../config';

export default function AdminDashboardPage() {
  const { token, user, logout } = useAuth();
  
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

  useEffect(() => {
    fetchStats();
    fetchRequests();
  }, [formTypeFilter, classFilter, statusFilter, receptionStart, receptionEnd]);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <span className="badge badge-success" style={{ marginBottom: '0.4rem' }}>
            <ShieldCheck size={14} style={{ marginRight: '4px' }} /> {
              user?.role === 'secretariat' ? "SECRÉTARIAT D'ÉGLISE" :
              (user?.role === 'president_conducteur' || user?.role === 'president') ? "PRÉSIDENT DES CONDUCTEURS" :
              user?.full_name || "CONDUCTEUR"
            }
          </span>
          <h1 style={{ fontSize: '2rem', color: '#0F172A' }}>
            {user?.role === 'secretariat' ? "Tableau de Bord & Gestion des Fiches" : "Gestion des Fiches"}
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Plateforme de demande de prières</p>
        </div>

        <button onClick={() => { fetchStats(); fetchRequests(); }} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      {/* Stats Cards Section */}
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
              <option value="Validé">Validé</option>
              <option value="Traité">Traité / Exaucé</option>
              <option value="Archivé">Archivé</option>
            </select>
          </div>

          {/* Filter 4: Date Start */}
          <div>
            <label className="form-label">Réception Du</label>
            <input type="date" className="form-control" value={receptionStart} onChange={(e) => setReceptionStart(e.target.value)} />
          </div>

          {/* Filter 5: Date End */}
          <div>
            <label className="form-label">Au</label>
            <input type="date" className="form-control" value={receptionEnd} onChange={(e) => setReceptionEnd(e.target.value)} />
          </div>

        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} color="#64748B" style={{ position: 'absolute', left: '12px' }} />
            <input 
              type="text" 
              placeholder="Recherche textuelle (code, nom du demandeur, classe, conducteur)..." 
              className="form-control"
              style={{ paddingLeft: '38px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
            Filtrer
          </button>
          {(formTypeFilter || classFilter || statusFilter || searchQuery || receptionStart || receptionEnd) && (
            <button 
              type="button" 
              onClick={() => {
                setFormTypeFilter('');
                setClassFilter('');
                setStatusFilter('');
                setSearchQuery('');
                setReceptionStart('');
                setReceptionEnd('');
              }}
              className="btn-secondary"
            >
              Réinitialiser
            </button>
          )}
        </form>

      </div>

      {/* Main Request Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#0F172A' }}>Répertoire Général ({total} fiches)</h3>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Chargement du répertoire...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Aucune fiche ne correspond aux critères sélectionnés.</div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>Code</th>
                  <th style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>Type</th>
                  <th style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>Demandeur / Concerne</th>
                  <th style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>Classe Méthodiste</th>
                  <th style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>Reçue Le</th>
                  <th style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>Validation Secrétariat</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                    
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#107C41', whiteSpace: 'nowrap' }}>
                      {req.tracking_code}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                      <span className="badge badge-neutral">{getFormTitle(req.form_type)}</span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
                      {req.demandeur_nom || 'Non spécifié'}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: '#107C41', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {req.methode_classe || 'Non spécifiée'}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {new Date(req.reception_date).toLocaleDateString('fr-FR')}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                      {user?.role === 'secretariat' ? (
                        <select 
                          value={req.is_validated ? 'Validé' : 'Nouveau'} 
                          onChange={(e) => {
                            const val = e.target.value === 'Validé';
                            handleStatusUpdate(req.id, e.target.value, val);
                          }}
                          style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            backgroundColor: req.is_validated ? '#DCFCE7' : '#FEF3C7',
                            color: req.is_validated ? '#15803D' : '#B45309'
                          }}
                        >
                          <option value="Nouveau">En attente (Non validé)</option>
                          <option value="Validé">Validé par le Secrétariat</option>
                          <option value="Traité">Traité / Exaucé</option>
                          <option value="Archivé">Archivé</option>
                        </select>
                      ) : (
                        <span className={`badge ${req.is_validated ? 'badge-success' : 'badge-neutral'}`}>
                          {req.is_validated ? 'Validé' : 'En attente'}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        
                        <button 
                          onClick={() => setSelectedReqForModal(req)}
                          className="btn-primary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                          title="Aperçu et Export Document Word/PDF"
                        >
                          <Eye size={14} /> Aperçu / Imprimer
                        </button>

                        {user?.role === 'secretariat' && (
                          <button 
                            onClick={() => handleDelete(req.id)}
                            style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', backgroundColor: '#FEE2E2', color: '#EF4444' }}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
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
