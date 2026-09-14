import React, { useState } from 'react';
import { FileText, HeartHandshake, Baby, Calendar, CheckCircle2, ArrowRight, Copy, Check, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import PrintableFormModal from '../components/PrintableFormModal';
import { API_BASE_URL, METHODIST_CLASSES } from '../config';

import { useAuth } from '../context/AuthContext';

export default function SubmitFormPage({ setActiveTab, onTrackCodeSelect }) {
  const { user } = useAuth();
  const [activeForm, setActiveForm] = useState('DEMANDE_PRIERE');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photos, setPhotos] = useState([]); // List of uploaded image URLs
  const [createdRequest, setCreatedRequest] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    // Common
    classe: user?.methode_classe || '',
    conducteur: user?.full_name || '',
    fait_a_date: new Date().toISOString().split('T')[0],

    // Demande Priere
    date_priere: '',
    priere_soutien: false,
    priere_guerison: false,
    priere_action_grace: false,
    demandeur: '',
    sujet: '',

    // Necrologie
    famille: '',
    sexe_defunt: 'Masculin',
    frere_soeur: '',
    decede_le: '',
    lieu_deces: '',
    lieu_veillee: '',
    lieu_levee: '',
    date_enterrement: '',
    lieu_enterrement: '',
    veillees: [
      { titre: 'Veillée 1', lieu_date: '' }
    ],

    // Presentation enfant
    date_presentation: '',
    nom_enfant: '',
    sexe_enfant: 'Masculin',
    nom_pere: '',
    nom_mere: '',

    // Reunion classe
    date_reunion: '',
    lieu: '',
    heure: '',
    lieu_rassemblement: ''
  });

  const handleAddVeillee = () => {
    setFormData(prev => ({
      ...prev,
      veillees: [
        ...prev.veillees,
        { titre: `Veillée ${prev.veillees.length + 1}`, lieu_date: '' }
      ]
    }));
  };

  const handleRemoveVeillee = (index) => {
    setFormData(prev => ({
      ...prev,
      veillees: prev.veillees.filter((_, idx) => idx !== index)
    }));
  };

  const handleVeilleeChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.veillees];
      updated[index] = { ...updated[index], lieu_date: value };
      return { ...prev, veillees: updated };
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleClassSelect = (e) => {
    const selectedClassName = e.target.value;
    const found = METHODIST_CLASSES.find(c => c.name === selectedClassName);
    
    setFormData(prev => ({
      ...prev,
      classe: selectedClassName,
      conducteur: found ? found.conductor : prev.conducteur
    }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingPhoto(true);

    for (const file of files) {
      const uploadPayload = new FormData();
      uploadPayload.append('photo', file);

      try {
        const res = await fetch(`${API_BASE_URL}/api/requests/upload_photo`, {
          method: 'POST',
          body: uploadPayload
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setPhotos(prev => [...prev, data.url]);
        } else {
          alert(data.message || "Erreur de téléversement de la photo.");
        }
      } catch (err) {
        alert("Erreur lors de l'envoi de la photo.");
      }
    }

    setUploadingPhoto(false);
  };

  const handleRemovePhoto = (indexToRemove) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let detailsPayload = { 
      fait_a_date: formData.fait_a_date,
      photos: photos
    };

    let demandeurNom = '';
    if (activeForm === 'DEMANDE_PRIERE') {
      demandeurNom = formData.demandeur;
      detailsPayload = {
        ...detailsPayload,
        date_priere: formData.date_priere,
        priere_soutien: formData.priere_soutien,
        priere_guerison: formData.priere_guerison,
        priere_action_grace: formData.priere_action_grace,
        classe: formData.classe,
        conducteur: formData.conducteur,
        demandeur: formData.demandeur,
        sujet: formData.sujet
      };
    } else if (activeForm === 'NECROLOGIE') {
      demandeurNom = formData.famille;
      detailsPayload = {
        ...detailsPayload,
        famille: formData.famille,
        classe: formData.classe,
        sexe_defunt: formData.sexe_defunt,
        frere_soeur: formData.frere_soeur,
        decede_le: formData.decede_le,
        lieu_deces: formData.lieu_deces,
        lieu_veillee: formData.lieu_veillee,
        lieu_levee: formData.lieu_levee,
        date_enterrement: formData.date_enterrement,
        lieu_enterrement: formData.lieu_enterrement,
        veillees: formData.veillees
      };
    } else if (activeForm === 'PRESENTATION_ENFANT') {
      demandeurNom = formData.nom_enfant;
      detailsPayload = {
        ...detailsPayload,
        date_presentation: formData.date_presentation,
        nom_enfant: formData.nom_enfant,
        sexe_enfant: formData.sexe_enfant,
        nom_pere: formData.nom_pere,
        nom_mere: formData.nom_mere,
        classe: formData.classe,
        conducteur: formData.conducteur
      };
    } else if (activeForm === 'REUNION_CLASSE') {
      demandeurNom = `Réunion ${formData.classe}`;
      detailsPayload = {
        ...detailsPayload,
        classe: formData.classe,
        conducteur: formData.conducteur,
        date_reunion: formData.date_reunion,
        lieu: formData.lieu,
        heure: formData.heure,
        lieu_rassemblement: formData.lieu_rassemblement
      };
    }

    const payload = {
      form_type: activeForm,
      methode_classe: formData.classe,
      conducteur: formData.conducteur,
      demandeur_nom: demandeurNom,
      details: detailsPayload
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setCreatedRequest(data.request);
      } else {
        alert(data.message || "Erreur lors de l'enregistrement.");
      }
    } catch (err) {
      setLoading(false);
      alert("Erreur de connexion au serveur backend backend Flask.");
    }
  };

  const copyCode = () => {
    if (createdRequest) {
      navigator.clipboard.writeText(createdRequest.tracking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (user?.role === 'secretariat') {
    return (
      <div className="container animate-fade-in" style={{ padding: '3rem 1.25rem', maxWidth: '700px', margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <FileText size={36} />
          </div>

          <h2 style={{ fontSize: '1.6rem', color: '#0F172A', marginBottom: '0.75rem' }}>
            Accès Rôle Secrétariat
          </h2>

          <p style={{ color: '#64748B', lineHeight: '1.6', marginBottom: '2rem' }}>
            Conformément aux règles d'accès de la plateforme, les demandes de prière sont enregistrées par les <strong>Conducteurs de classe</strong>. Le Secrétariat intervient pour la consultation, la validation et l'export des fiches.
          </p>

          <button 
            onClick={() => setActiveTab('admin')} 
            className="btn-primary" 
            style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', margin: '0 auto' }}
          >
            Accéder au Répertoire Général (Secrétariat)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2.5rem 1.25rem' }}>
      
      {/* Success Confirmation Screen */}
      {createdRequest ? (
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#DCFCE7',
              color: '#107C41',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <CheckCircle2 size={42} />
            </div>

            <h2 style={{ fontSize: '1.8rem', color: '#0F172A', marginBottom: '0.5rem' }}>
              Soumission Réussie !
            </h2>

            <p style={{ color: '#64748B', marginBottom: '2rem' }}>
              Votre fiche de prière/événement a été enregistrée avec succès auprès du Temple Bethesda.
            </p>

            {/* Tracking Code Highlight Box */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '2px dashed #107C41',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                VOTRE NUMÉRO DE SUIVI ET MODIFICATION
              </div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.2rem',
                fontWeight: 800,
                color: '#107C41',
                letterSpacing: '1px',
                marginBottom: '0.75rem'
              }}>
                {createdRequest.tracking_code}
              </div>

              <button 
                onClick={copyCode}
                className="btn-secondary" 
                style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
              >
                {copied ? <><Check size={16} color="#107C41" /> Code copié !</> : <><Copy size={16} /> Copier le code</>}
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '2rem' }}>
              Conservation : Ce numéro vous permettra de <strong>suivre et modifier</strong> votre fiche tant qu'elle n'est pas encore validée par le secrétariat.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setShowPreviewModal(true)} 
                className="btn-primary"
              >
                Voir / Imprimer la Fiche PDF
              </button>

              <button 
                onClick={() => {
                  onTrackCodeSelect(createdRequest.tracking_code);
                  setActiveTab('track');
                }}
                className="btn-secondary"
              >
                Consulter le Statut
              </button>

              <button 
                onClick={() => {
                  setCreatedRequest(null);
                  setFormData({
                    classe: '', conducteur: '', fait_a_date: new Date().toISOString().split('T')[0],
                    date_priere: '', priere_soutien: false, priere_guerison: false, priere_action_grace: false, demandeur: '', sujet: '',
                    famille: '', frere_soeur: '', decede_le: '', lieu_deces: '', lieu_veillee: '', lieu_levee: '', date_enterrement: '', lieu_enterrement: '',
                    date_presentation: '', nom_enfant: '', nom_pere: '', nom_mere: '', date_reunion: '', lieu: '', heure: '', lieu_rassemblement: ''
                  });
                }}
                className="btn-secondary"
              >
                Remplir une autre fiche
              </button>
            </div>

          </div>

          {showPreviewModal && (
            <PrintableFormModal 
              request={createdRequest}
              onClose={() => setShowPreviewModal(false)}
            />
          )}

        </div>
      ) : (

        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Remplir une Fiche Officielle</h1>
            <p style={{ color: '#64748B' }}>Numérisation de la Fiche de Prière du Temple Bethesda de Yopougon Niangon Sud</p>
          </div>

          {/* Form Type Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '0.4rem',
            marginBottom: '2rem',
            gap: '0.4rem',
            overflowX: 'auto'
          }}>
            <button 
              onClick={() => setActiveForm('DEMANDE_PRIERE')}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: activeForm === 'DEMANDE_PRIERE' ? '#107C41' : '#64748B',
                backgroundColor: activeForm === 'DEMANDE_PRIERE' ? '#E6F4EA' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
            >
              <HeartHandshake size={18} /> Demande de Prière
            </button>

            <button 
              onClick={() => setActiveForm('NECROLOGIE')}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: activeForm === 'NECROLOGIE' ? '#D97706' : '#64748B',
                backgroundColor: activeForm === 'NECROLOGIE' ? '#FEF3C7' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
            >
              <FileText size={18} /> Nécrologie
            </button>

            <button 
              onClick={() => setActiveForm('PRESENTATION_ENFANT')}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: activeForm === 'PRESENTATION_ENFANT' ? '#0369A1' : '#64748B',
                backgroundColor: activeForm === 'PRESENTATION_ENFANT' ? '#E0F2FE' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Baby size={18} /> Présentation d'Enfant
            </button>

            <button 
              onClick={() => setActiveForm('REUNION_CLASSE')}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: activeForm === 'REUNION_CLASSE' ? '#475569' : '#64748B',
                backgroundColor: activeForm === 'REUNION_CLASSE' ? '#F1F5F9' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Calendar size={18} /> Réunion de Classe
            </button>
          </div>

          {/* Form Card */}
          <div className="card">
            
            <form onSubmit={handleSubmit}>
              
              {/* Form 1: Demande de Priere */}
              {activeForm === 'DEMANDE_PRIERE' && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: '#107C41', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HeartHandshake size={20} /> Formulaire de Demande de Prière
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    
                    <div className="form-group">
                      <label className="form-label">Date de la prière *</label>
                      <input type="date" name="date_priere" className="form-control" value={formData.date_priere} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Demandeur (Nom & Prénoms) *</label>
                      <input type="text" name="demandeur" placeholder="Ex: Sœur Kouassi Aminata" className="form-control" value={formData.demandeur} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Classe Méthodiste *</label>
                      <select name="classe" className="form-control" value={formData.classe} onChange={handleClassSelect} required>
                        <option value="">-- Choisir la Classe Méthodiste (28 Classes) --</option>
                        {METHODIST_CLASSES.map((cls, idx) => (
                          <option key={idx} value={cls.name}>{cls.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Conducteur (trice) *</label>
                      <input type="text" name="conducteur" placeholder="Conducteur (auto-rempli)" className="form-control" value={formData.conducteur} onChange={handleChange} required />
                    </div>

                  </div>

                  {/* Types de priere checkboxes */}
                  <div style={{ margin: '1.25rem 0', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <label className="form-label" style={{ marginBottom: '0.75rem' }}>Cochez le ou les types de prière souhaités :</label>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>
                        <input type="checkbox" name="priere_soutien" checked={formData.priere_soutien} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#107C41' }} />
                        Prière de Soutien
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>
                        <input type="checkbox" name="priere_guerison" checked={formData.priere_guerison} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#107C41' }} />
                        Prière de Guérison
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>
                        <input type="checkbox" name="priere_action_grace" checked={formData.priere_action_grace} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#107C41' }} />
                        Prière d'Action de Grâce
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sujet de prière détaillé *</label>
                    <textarea name="sujet" rows="4" placeholder="Exprimez votre sujet de prière..." className="form-control" value={formData.sujet} onChange={handleChange} required />
                  </div>

                </div>
              )}

              {/* Form 2: Necrologie */}
              {activeForm === 'NECROLOGIE' && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} /> Formulaire de Nécrologie & Obsèques
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    
                    <div className="form-group">
                      <label className="form-label">La Famille *</label>
                      <input type="text" name="famille" placeholder="Ex: La Famille Yao à Niangon" className="form-control" value={formData.famille} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">La Classe Méthodiste *</label>
                      <select name="classe" className="form-control" value={formData.classe} onChange={handleClassSelect} required>
                        <option value="">-- Choisir la Classe Méthodiste (28 Classes) --</option>
                        {METHODIST_CLASSES.map((cls, idx) => (
                          <option key={idx} value={cls.name}>{cls.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Sexe du défunt *</label>
                      <select name="sexe_defunt" className="form-control" value={formData.sexe_defunt} onChange={handleChange} required>
                        <option value="Masculin">Masculin (Du Frère décédé)</option>
                        <option value="Féminin">Féminin (De la Sœur décédée)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nom du Frère (de la Sœur) décédé(e) *</label>
                      <input type="text" name="frere_soeur" placeholder="Ex: Feu Frère Yao Kouadio Pierre" className="form-control" value={formData.frere_soeur} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Décédé(e) le *</label>
                      <input type="date" name="decede_le" className="form-control" value={formData.decede_le} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lieu de Décès *</label>
                      <input type="text" name="lieu_deces" placeholder="Ex: CHU de Yopougon" className="form-control" value={formData.lieu_deces} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lieu de la Levée de Corps</label>
                      <input type="text" name="lieu_levee" placeholder="Ex: Morgue d'Anyama" className="form-control" value={formData.lieu_levee} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date de l'Enterrement *</label>
                      <input type="date" name="date_enterrement" className="form-control" value={formData.date_enterrement} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lieu de l'Enterrement *</label>
                      <input type="text" name="lieu_enterrement" placeholder="Ex: Cimetière Municipal de Yopougon" className="form-control" value={formData.lieu_enterrement} onChange={handleChange} required />
                    </div>

                  </div>

                  {/* Multiple Veillées Dynamic Block */}
                  <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: '#FEF3C7', borderRadius: '12px', border: '1px solid #FCD34D' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <label className="form-label" style={{ fontWeight: 700, color: '#92400E', margin: 0 }}>
                        Programme des Veillées (Veillée 1, Veillée 2, etc.)
                      </label>
                      <button 
                        type="button" 
                        onClick={handleAddVeillee} 
                        className="btn-secondary"
                        style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', backgroundColor: '#FFFFFF' }}
                      >
                        + Ajouter une veillée
                      </button>
                    </div>

                    {formData.veillees.map((v, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ width: '130px', fontWeight: 700, flexShrink: 0 }} 
                          value={v.titre} 
                          onChange={(e) => {
                            const updated = [...formData.veillees];
                            updated[idx].titre = e.target.value;
                            setFormData(prev => ({ ...prev, veillees: updated }));
                          }} 
                        />
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Ex: Veillée religieuse le 20/09/2026 à 19h au Temple Bethesda" 
                          value={v.lieu_date} 
                          onChange={(e) => handleVeilleeChange(idx, e.target.value)} 
                        />
                        {formData.veillees.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveVeillee(idx)} 
                            style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* Form 3: Presentation d'enfant */}
              {activeForm === 'PRESENTATION_ENFANT' && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Baby size={20} /> Formulaire de Présentation d'Enfant
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    
                    <div className="form-group">
                      <label className="form-label">Date de Présentation au Temple *</label>
                      <input type="date" name="date_presentation" className="form-control" value={formData.date_presentation} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nom & Prénoms de l'Enfant *</label>
                      <input type="text" name="nom_enfant" placeholder="Ex: Bohoussou Samuel Yoann" className="form-control" value={formData.nom_enfant} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Genre de l'Enfant *</label>
                      <select name="sexe_enfant" className="form-control" value={formData.sexe_enfant} onChange={handleChange} required>
                        <option value="Masculin">Masculin</option>
                        <option value="Féminin">Féminin</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nom & Prénoms du Père *</label>
                      <input type="text" name="nom_pere" placeholder="Ex: Bohoussou Marc" className="form-control" value={formData.nom_pere} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nom & Prénoms de la Mère *</label>
                      <input type="text" name="nom_mere" placeholder="Ex: Bohoussou Esther" className="form-control" value={formData.nom_mere} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Classe Méthodiste *</label>
                      <select name="classe" className="form-control" value={formData.classe} onChange={handleClassSelect} required>
                        <option value="">-- Choisir la Classe Méthodiste (28 Classes) --</option>
                        {METHODIST_CLASSES.map((cls, idx) => (
                          <option key={idx} value={cls.name}>{cls.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Conducteur (trice) *</label>
                      <input type="text" name="conducteur" placeholder="Conducteur (auto-rempli)" className="form-control" value={formData.conducteur} onChange={handleChange} required />
                    </div>

                  </div>
                </div>
              )}

              {/* Form 4: Reunion de classe */}
              {activeForm === 'REUNION_CLASSE' && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} /> Formulaire de Réunion de Classe Méthodiste
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    
                    <div className="form-group">
                      <label className="form-label">Classe Méthodiste *</label>
                      <select name="classe" className="form-control" value={formData.classe} onChange={handleClassSelect} required>
                        <option value="">-- Choisir la Classe Méthodiste (28 Classes) --</option>
                        {METHODIST_CLASSES.map((cls, idx) => (
                          <option key={idx} value={cls.name}>{cls.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Conducteur (trice) *</label>
                      <input type="text" name="conducteur" placeholder="Conducteur (auto-rempli)" className="form-control" value={formData.conducteur} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date de la réunion *</label>
                      <input type="date" name="date_reunion" className="form-control" value={formData.date_reunion} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Heure *</label>
                      <input type="time" name="heure" className="form-control" value={formData.heure} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lieu de la réunion *</label>
                      <input type="text" name="lieu" placeholder="Ex: Salle d'étude du Temple" className="form-control" value={formData.lieu} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lieu de rassemblement *</label>
                      <input type="text" name="lieu_rassemblement" placeholder="Ex: Cour principale du Temple" className="form-control" value={formData.lieu_rassemblement} onChange={handleChange} required />
                    </div>

                  </div>
                </div>
              )}

              {/* Photo Upload Component */}
              <div style={{ marginTop: '1.75rem', padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1.5px dashed #CBD5E1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#107C41' }}>
                  <ImageIcon size={18} /> Joindre une ou des photos (PNG / JPEG) - Optionnel
                </label>
                <p style={{ fontSize: '0.83rem', color: '#64748B', marginBottom: '1rem' }}>
                  Vous pouvez joindre des photos (photo du défunt, photo de l'enfant, intention de prière...).
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <label className="btn-secondary" style={{ cursor: 'pointer', fontSize: '0.88rem' }}>
                    <Upload size={16} /> {uploadingPhoto ? "Téléversement en cours..." : "Téléverser des photos (PNG / JPEG)"}
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      multiple 
                      onChange={handlePhotoUpload} 
                      disabled={uploadingPhoto} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>

                {/* Uploaded Photos Thumbnails Preview */}
                {photos.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    {photos.map((photoUrl, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '85px', height: '85px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                        <img src={`${API_BASE_URL}${photoUrl}`} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          type="button" 
                          onClick={() => handleRemovePhoto(idx)}
                          style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: '#FFF', borderRadius: '50%', padding: '3px' }}
                          title="Supprimer la photo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom date and Submit button */}
              <div style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>
                  Fait à Abidjan le : {new Date().toLocaleDateString('fr-FR')}
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                  style={{ minWidth: '200px', justifyContent: 'center' }}
                >
                  {loading ? "Enregistrement en cours..." : <>Soumettre la Fiche <ArrowRight size={18} /></>}
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
