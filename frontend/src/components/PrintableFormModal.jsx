import React from 'react';
import { X, Download, Printer, FileText, CheckCircle } from 'lucide-react';
import logoImg from '../assets/eglise.png';
import { API_BASE_URL } from '../config';

export default function PrintableFormModal({ request, onClose, token }) {
  if (!request) return null;

  const details = request.details || {};
  const formType = request.form_type;

  const getTitle = () => {
    switch (formType) {
      case 'NECROLOGIE': return 'NECROLOGIE';
      case 'DEMANDE_PRIERE': return 'DEMANDE DE PRIERE';
      case 'PRESENTATION_ENFANT': return 'PRESENTATION D’ENFANT';
      case 'REUNION_CLASSE': return 'REUNION DE CLASSE METHODISTE';
      default: return 'FICHE BETHESDA';
    }
  };

  const handleExportWord = () => {
    const url = `${API_BASE_URL}/api/admin/requests/${request.id}/export/word`;
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `Fiche_${request.tracking_code}_${formType}.docx`;
      a.click();
    })
    .catch(err => alert("Erreur d'exportation Word: " + err));
  };

  const handleExportPdf = () => {
    const url = `${API_BASE_URL}/api/admin/requests/${request.id}/export/pdf`;
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `Fiche_${request.tracking_code}_${formType}.pdf`;
      a.click();
    })
    .catch(err => alert("Erreur d'exportation PDF: " + err));
  };

  const handlePrint = () => {
    window.print();
  };

  const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const DAYS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

  const formatFrenchDate = (val, includeDayName = true) => {
    if (!val) return '';
    let str = String(val).trim().replace(/\.+$|\.\.\.+/g, '');
    
    // 1. Exact ISO YYYY-MM-DD or DD/MM/YYYY
    let dt = null;
    if (str.length === 10 && str[4] === '-' && str[7] === '-') {
      const parts = str.split('-');
      dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else if (str.length === 10 && str[2] === '/' && str[5] === '/') {
      const parts = str.split('/');
      dt = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }

    if (dt && !isNaN(dt.getTime())) {
      const dayName = DAYS_FR[dt.getDay() === 0 ? 6 : dt.getDay() - 1];
      const monthName = MONTHS_FR[dt.getMonth()];
      return includeDayName ? `${dayName} ${dt.getDate()} ${monthName} ${dt.getFullYear()}` : `${dt.getDate()} ${monthName} ${dt.getFullYear()}`;
    }

    // 2. Convert embedded numerical dates (e.g. 20/09/2026 or 2026-09-20) in text
    let resStr = str.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (match, d, m, y) => {
      const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      if (!isNaN(dObj.getTime())) {
        const dName = DAYS_FR[dObj.getDay() === 0 ? 6 : dObj.getDay() - 1];
        const mName = MONTHS_FR[dObj.getMonth()];
        return includeDayName ? `${dName} ${dObj.getDate()} ${mName} ${dObj.getFullYear()}` : `${dObj.getDate()} ${mName} ${dObj.getFullYear()}`;
      }
      return match;
    });

    resStr = resStr.replace(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, (match, y, m, d) => {
      const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      if (!isNaN(dObj.getTime())) {
        const dName = DAYS_FR[dObj.getDay() === 0 ? 6 : dObj.getDay() - 1];
        const mName = MONTHS_FR[dObj.getMonth()];
        return includeDayName ? `${dName} ${dObj.getDate()} ${mName} ${dObj.getFullYear()}` : `${dObj.getDate()} ${mName} ${dObj.getFullYear()}`;
      }
      return match;
    });

    return resStr;
  };

  const getCleanFaitADate = () => {
    const raw = details.fait_a_date || request.created_at;
    if (!raw) return formatFrenchDate(new Date().toISOString().split('T')[0], true);
    return formatFrenchDate(raw, true);
  };

  const conductorName = details.conducteur || request.conducteur || 'Conducteur';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        maxWidth: '850px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header Bar (No-print) */}
        <div className="no-print" style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={18} color="#107C41" /> Aperçu Officiel
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
                {request.tracking_code}
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
              Modèle A4 officiel conforme avec 2 signatures
            </span>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: '#E2E8F0', color: '#475569', flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Action Buttons Toolbar (No-print) */}
        <div className="no-print" style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {token && (
            <>
              <button onClick={handleExportWord} className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}>
                <Download size={15} /> Exporter Word (.docx)
              </button>
              <button onClick={handleExportPdf} className="btn-accent" style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}>
                <Download size={15} /> Exporter PDF
              </button>
            </>
          )}
          <button onClick={handlePrint} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}>
            <Printer size={15} /> Imprimer
          </button>
        </div>

        {/* Printable Area (Conforming to Fiche de Prière.pdf A4 specification) */}
        <div className="printable-area" style={{ 
          padding: '2.5rem 3rem', 
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '800px',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Header section with logo & church titles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', borderBottom: '2px solid #F1F5F9', paddingBottom: '1rem', flexWrap: 'wrap' }}>
              <img src={logoImg} alt="Logo" style={{ width: '75px', height: '75px', objectFit: 'contain' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                  EGLISE METHODISTE DE COTE D’IVOIRE
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>
                  DISTRICT DE YOPOUGON – CIRCUIT NIANGON
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#107C41' }}>
                  TEMPLE BETHESDA
                </div>
              </div>
            </div>

            {/* Form Title Banner Box */}
            <div className="printable-banner-box" style={{
              textAlign: 'center',
              margin: '0 auto 2rem auto',
              padding: '0.6rem 1.5rem',
              border: '2px solid #107C41',
              borderRadius: '12px',
              backgroundColor: '#F8FAFC',
              maxWidth: '450px'
            }}>
              <h2 className="printable-banner-title" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#107C41', letterSpacing: '0.5px' }}>
                {getTitle()}
              </h2>
            </div>

            {/* Form Fields Content */}
            <div style={{ fontSize: '1rem', color: '#0F172A', lineHeight: 2.2 }}>
              
              {formType === 'NECROLOGIE' && (
                <div>
                  <div><strong>LA FAMILLE :</strong> {details.famille}</div>
                  <div><strong>ET LA CLASSE :</strong> {details.classe || request.methode_classe}</div>
                  
                  <div style={{ margin: '1.25rem 0', fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
                    Ont la profonde douleur de vous annoncer le décès,
                  </div>

                  <div>
                    <strong>{details.sexe_defunt === 'Féminin' ? 'DE LA SŒUR DÉCÉDÉE :' : 'DU FRÈRE DÉCÉDÉ :'}</strong> {details.frere_soeur}
                  </div>
                  <div><strong>DÉCÉDÉ(E) LE :</strong> {formatFrenchDate(details.decede_le, true)}</div>
                  <div><strong>LIEU DE DÉCÈS :</strong> {details.lieu_deces}</div>
                  
                  {/* Veillées list */}
                  {details.veillees && details.veillees.length > 0 ? (
                    details.veillees.map((v, idx) => (
                      <div key={idx}><strong>{(v.titre || `VEILLÉE ${idx + 1}`).toUpperCase()} :</strong> {formatFrenchDate(v.lieu_date, true)}</div>
                    ))
                  ) : (
                    <div><strong>LIEU DE VEILLÉE :</strong> {formatFrenchDate(details.lieu_veillee, true)}</div>
                  )}

                  <div><strong>LIEU DE LA LEVÉE :</strong> {details.lieu_levee}</div>
                  <div><strong>DATE DE L’ENTERREMENT :</strong> {formatFrenchDate(details.date_enterrement, true)}</div>
                  <div><strong>LIEU DE L’ENTERREMENT :</strong> {details.lieu_enterrement}</div>
                </div>
              )}

              {formType === 'DEMANDE_PRIERE' && (
                <div>
                  <div><strong>DATE DE LA PRIERE :</strong> {formatFrenchDate(details.date_priere || request.event_date, true)}</div>
                  
                  {/* ONLY display requested prayer types in green color! */}
                  <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 700, color: '#107C41' }}>
                    {details.priere_soutien && (
                      <div style={{ fontSize: '1.05rem' }}>PRIERE DE SOUTIEN : [ X ]</div>
                    )}
                    {details.priere_guerison && (
                      <div style={{ fontSize: '1.05rem' }}>PRIERE DE GUERISON : [ X ]</div>
                    )}
                    {details.priere_action_grace && (
                      <div style={{ fontSize: '1.05rem' }}>PRIERE D’ACTION DE GRACE : [ X ]</div>
                    )}
                    {!details.priere_soutien && !details.priere_guerison && !details.priere_action_grace && (
                      <div style={{ fontSize: '1.05rem' }}>PRIERE D’ACTION DE GRACE : [ X ]</div>
                    )}
                  </div>

                  <div><strong>CLASSE METHODISTE :</strong> {details.classe || request.methode_classe}</div>
                  <div><strong>CONDUCTEUR (TRICE) :</strong> {details.conducteur || request.conducteur}</div>
                  <div><strong>DEMANDEUR :</strong> {details.demandeur || request.demandeur_nom}</div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>SUJET :</strong> {details.sujet}
                  </div>
                </div>
              )}

              {formType === 'PRESENTATION_ENFANT' && (
                <div>
                  <div><strong>DATE DE PRÉSENTATION :</strong> {formatFrenchDate(details.date_presentation || request.event_date, true)}</div>
                  <div><strong>NOM DE L’ENFANT :</strong> {details.nom_enfant}</div>
                  <div><strong>GENRE DE L’ENFANT :</strong> {details.sexe_enfant || details.genre_enfant || 'Masculin'}</div>
                  <div><strong>NOM DU PÈRE :</strong> {details.nom_pere}</div>
                  <div><strong>NOM DE LA MÈRE :</strong> {details.nom_mere}</div>
                  <div><strong>CLASSE METHODISTE :</strong> {details.classe || request.methode_classe}</div>
                  <div><strong>CONDUCTEUR (TRICE) :</strong> {details.conducteur || request.conducteur}</div>
                </div>
              )}

              {formType === 'REUNION_CLASSE' && (
                <div>
                  <div><strong>Classe méthodiste :</strong> {details.classe || request.methode_classe}</div>
                  <div><strong>Conducteur (trice) :</strong> {details.conducteur || request.conducteur}</div>
                  <div><strong>Date de la réunion :</strong> {formatFrenchDate(details.date_reunion || request.event_date, true)}</div>
                  <div><strong>Lieu :</strong> {details.lieu}</div>
                  <div><strong>Heure :</strong> {details.heure}</div>
                  <div><strong>Lieu de rassemblement :</strong> {details.lieu_rassemblement}</div>
                </div>
              )}

              {/* Photos Attached Section - Preserving Aspect Ratio */}
              {details.photos && details.photos.length > 0 && (
                <div style={{ marginTop: '1.75rem', borderTop: '1px dashed #CBD5E1', paddingTop: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#107C41', marginBottom: '0.5rem' }}>
                    📷 Photo(s) Jointe(s) :
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {details.photos.map((photoUrl, idx) => (
                      <a key={idx} href={`${API_BASE_URL}${photoUrl}`} target="_blank" rel="noreferrer">
                        <img 
                          src={`${API_BASE_URL}${photoUrl}`} 
                          alt={`Photo jointe ${idx + 1}`} 
                          style={{ 
                            maxWidth: '220px', 
                            maxHeight: '180px', 
                            width: 'auto', 
                            height: 'auto', 
                            objectFit: 'contain', 
                            borderRadius: '10px', 
                            border: '1.5px solid #CBD5E1', 
                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)' 
                          }} 
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Bottom Section: Fait a Abidjan + 2 Signatures at the absolute bottom margin */}
          <div style={{ marginTop: '4rem' }}>
            
            {/* Date Fait à Abidjan */}
            <div style={{ textAlign: 'right', marginBottom: '3rem', fontWeight: 700, fontStyle: 'italic', fontSize: '0.95rem' }}>
              Fait à Abidjan le {getCleanFaitADate()}
            </div>

            {/* 2 Signatures Row Anchored at Bottom */}
            <div className="signatures-row" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.88rem'
            }}>
              <div style={{ borderTop: '1.5px solid #0F172A', paddingTop: '0.5rem' }}>
                SIGNATURE DU CONDUCTEUR
                <div style={{ fontWeight: 500, fontStyle: 'italic', fontSize: '0.82rem', marginTop: '0.35rem', color: '#475569' }}>
                  {conductorName}
                </div>
              </div>
              <div style={{ borderTop: '1.5px solid #0F172A', paddingTop: '0.5rem' }}>
                AVIS DU BUREAU DU CONSEIL
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
