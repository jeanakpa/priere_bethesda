import React, { useState, useEffect } from 'react';
import { Search, Lock, Edit3, CheckCircle2, AlertCircle, FileText, Save, ArrowLeft, Eye } from 'lucide-react';
import PrintableFormModal from '../components/PrintableFormModal';
import { API_BASE_URL } from '../config';

export default function TrackFormPage({ trackingCodeParam }) {
  const [code, setCode] = useState(trackingCodeParam || '');
  const [loading, setLoading] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editDetails, setEditDetails] = useState({});
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (trackingCodeParam) {
      setCode(trackingCodeParam);
      fetchRequest(trackingCodeParam);
    }
  }, [trackingCodeParam]);

  const fetchRequest = async (searchCode) => {
    if (!searchCode.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditing(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/track/${encodeURIComponent(searchCode.trim())}`);
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setRequestData(data.request);
        setEditDetails(data.request.details || {});
      } else {
        setRequestData(null);
        setErrorMsg(data.message || 'Fiche non trouvée.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Erreur lors de la connexion au serveur Flask backend.');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequest(code);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/track/${requestData.tracking_code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          details: editDetails,
          methode_classe: editDetails.classe,
          conducteur: editDetails.conducteur
        })
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setRequestData(data.request);
        setIsEditing(false);
        setSuccessMsg('Fiche modifiée et mise à jour avec succès !');
      } else {
        setErrorMsg(data.message || 'Erreur lors de la mise à jour.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Erreur lors de la sauvegarde.');
    }
  };

  const getFormTitle = (type) => {
    switch (type) {
      case 'NECROLOGIE': return 'Fiche de Nécrologie';
      case 'DEMANDE_PRIERE': return 'Demande de Prière';
      case 'PRESENTATION_ENFANT': return 'Présentation d’Enfant';
      case 'REUNION_CLASSE': return 'Réunion de Classe Méthodiste';
      default: return type;
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '3rem 1.25rem' }}>
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Suivi & Modification de Fiche</h1>
          <p style={{ color: '#64748B' }}>Entrez votre code unique de suivi (ex: BET-2026-1001) pour consulter ou modifier votre fiche</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Search size={20} color="#64748B" style={{ position: 'absolute', left: '12px' }} />
              <input 
                type="text"
                placeholder="Code unique (ex: BET-2026-1001)..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Recherche..." : "Rechercher"}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div style={{ padding: '1rem 1.25rem', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={22} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '1rem 1.25rem', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Request Result View */}
        {requestData && (
          <div className="card">
            
            {/* Header info bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-neutral" style={{ marginBottom: '0.4rem' }}>
                  {getFormTitle(requestData.form_type)}
                </span>
                <h2 style={{ fontSize: '1.5rem', color: '#107C41', fontFamily: 'var(--font-heading)' }}>
                  Code : {requestData.tracking_code}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Reçue le : {new Date(requestData.reception_date).toLocaleDateString('fr-FR')}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: '0.2rem' }}>STATUT SECRÉTARIAT</div>
                {requestData.is_validated ? (
                  <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                    <CheckCircle2 size={16} style={{ marginRight: '4px' }} /> Validée par le Secrétariat
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                    En attente de validation
                  </span>
                )}
              </div>
            </div>

            {/* Editable Status Notice Box */}
            <div style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              backgroundColor: requestData.is_editable ? '#E6F4EA' : '#FEF3C7',
              border: `1px solid ${requestData.is_editable ? '#A7F3D0' : '#FDE68A'}`,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {requestData.is_editable ? (
                  <CheckCircle2 size={24} color="#107C41" />
                ) : (
                  <Lock size={24} color="#D97706" />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: requestData.is_editable ? '#065F46' : '#92400E' }}>
                    {requestData.is_editable ? "Fiche Modifiable" : "Fiche Verrouillée"}
                  </div>
                  <div style={{ fontSize: '0.83rem', color: requestData.is_editable ? '#047857' : '#B45309' }}>
                    {requestData.is_editable 
                      ? "Vous pouvez encore modifier cette fiche car elle n'a pas encore été validée par le secrétariat." 
                      : "Cette fiche ne peut plus être modifiée car elle a déjà été validée par le secrétariat ou sa date est passée."
                    }
                  </div>
                </div>
              </div>

              {requestData.is_editable && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <Edit3 size={16} /> Modifier les informations
                </button>
              )}
            </div>

            {/* Editing Form */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: '#107C41', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit3 size={18} /> Modification des champs
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  
                  {requestData.form_type === 'DEMANDE_PRIERE' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Date de la prière</label>
                        <input type="date" name="date_priere" className="form-control" value={editDetails.date_priere || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Demandeur</label>
                        <input type="text" name="demandeur" className="form-control" value={editDetails.demandeur || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Classe Méthodiste</label>
                        <input type="text" name="classe" className="form-control" value={editDetails.classe || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Conducteur (trice)</label>
                        <input type="text" name="conducteur" className="form-control" value={editDetails.conducteur || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Sujet de Prière</label>
                        <textarea name="sujet" rows="4" className="form-control" value={editDetails.sujet || ''} onChange={handleEditChange} required />
                      </div>
                    </>
                  )}

                  {requestData.form_type === 'NECROLOGIE' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">La Famille</label>
                        <input type="text" name="famille" className="form-control" value={editDetails.famille || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Classe Méthodiste</label>
                        <input type="text" name="classe" className="form-control" value={editDetails.classe || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Du Frère (de la Sœur)</label>
                        <input type="text" name="frere_soeur" className="form-control" value={editDetails.frere_soeur || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date d'enterrement</label>
                        <input type="date" name="date_enterrement" className="form-control" value={editDetails.date_enterrement || ''} onChange={handleEditChange} required />
                      </div>
                    </>
                  )}

                  {requestData.form_type === 'PRESENTATION_ENFANT' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Nom de l'enfant</label>
                        <input type="text" name="nom_enfant" className="form-control" value={editDetails.nom_enfant || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Nom du Père</label>
                        <input type="text" name="nom_pere" className="form-control" value={editDetails.nom_pere || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Nom de la Mère</label>
                        <input type="text" name="nom_mere" className="form-control" value={editDetails.nom_mere || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Classe Méthodiste</label>
                        <input type="text" name="classe" className="form-control" value={editDetails.classe || ''} onChange={handleEditChange} required />
                      </div>
                    </>
                  )}

                  {requestData.form_type === 'REUNION_CLASSE' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Classe Méthodiste</label>
                        <input type="text" name="classe" className="form-control" value={editDetails.classe || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Conducteur (trice)</label>
                        <input type="text" name="conducteur" className="form-control" value={editDetails.conducteur || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date de réunion</label>
                        <input type="date" name="date_reunion" className="form-control" value={editDetails.date_reunion || ''} onChange={handleEditChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Heure</label>
                        <input type="time" name="heure" className="form-control" value={editDetails.heure || ''} onChange={handleEditChange} required />
                      </div>
                    </>
                  )}

                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    <Save size={18} /> Enregistrer les modifications
                  </button>
                </div>

              </form>
            ) : (
              /* Read-only Data Overview */
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>DEMANDEUR / CONCERNÉ</span>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>{requestData.demandeur_nom || 'Non précisé'}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>CLASSE MÉTHODISTE</span>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#107C41' }}>{requestData.methode_classe || 'Non précisée'}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>CONDUCTEUR (TRICE)</span>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>{requestData.conducteur || 'Non précisé'}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>DATE DE L'ÉVÉNEMENT</span>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                      {requestData.event_date ? new Date(requestData.event_date).toLocaleDateString('fr-FR') : 'Non précisée'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0' }}>
                  <button onClick={() => setShowPreviewModal(true)} className="btn-secondary">
                    <Eye size={18} /> Voir l'Aperçu Officiel Impressif
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {showPreviewModal && requestData && (
          <PrintableFormModal 
            request={requestData}
            onClose={() => setShowPreviewModal(false)}
          />
        )}

      </div>
    </div>
  );
}
