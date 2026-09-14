import React, { useState } from 'react';
import { FileText, HeartHandshake, Baby, Calendar, Search, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import logoImg from '../assets/eglise.png';

export default function HomePage({ setActiveTab, onTrackCodeSelect }) {
  const [searchCode, setSearchCode] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCode.trim()) {
      onTrackCodeSelect(searchCode.trim());
      setActiveTab('track');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* Hero Section */}
      <section style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '4rem 0 3rem 0',
        backgroundImage: 'radial-gradient(#107C41 0.75px, transparent 0.75px)',
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0',
        position: 'relative'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '850px' }}>
          
          <img 
            src={logoImg} 
            alt="Logo Église Méthodiste" 
            style={{ width: '110px', height: '110px', objectFit: 'contain', marginBottom: '1.5rem' }} 
          />

          <h1 style={{
            fontSize: '2.5rem',
            lineHeight: 1.25,
            marginBottom: '1rem',
            color: '#0F172A',
            letterSpacing: '-0.5px'
          }}>
            Plateforme Numérique de Prière & d'Événements
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: '#475569',
            marginBottom: '2.5rem',
            fontWeight: 400
          }}>
            <strong style={{ color: '#107C41' }}>Église Méthodiste de Côte d'Ivoire</strong> • Temple Bethesda de Yopougon Niangon Sud. <br/>
            Soumettez et suivez facilement vos fiches de prière, annonces de nécrologie, présentations d'enfants et réunions de classe.
          </p>

          {/* Quick Tracking Search Bar */}
          <form 
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              backgroundColor: '#FFFFFF',
              padding: '0.5rem',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
              border: '1.5px solid #CBD5E1',
              maxWidth: '550px',
              margin: '0 auto 2.5rem auto'
            }}
          >
            <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.75rem', color: '#64748B' }}>
                <Search size={20} />
              </div>
              <input 
                type="text" 
                placeholder="N° de suivi (ex: BET-2026-1001)..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                style={{
                  flex: 1,
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.92rem'
                }}
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', whiteSpace: 'nowrap', minWidth: '110px' }}
            >
              Suivre <ArrowRight size={18} />
            </button>
          </form>

        </div>
      </section>

      {/* 4 Form Cards Grid */}
      <section className="container" style={{ marginTop: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', marginBottom: '0.5rem' }}>
            SERVICES EN LIGNE
          </span>
          <h2 style={{ fontSize: '1.8rem', color: '#0F172A' }}>Choisissez le formulaire à soumettre</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}>

          {/* Card 1: Demande de priere */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                backgroundColor: '#E6F4EA',
                color: '#107C41',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <HeartHandshake size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Demande de Prière</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Formulaire pour les prières de soutien, guérison ou actions de grâce pour vous ou un proche.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('submit')}
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Remplir la fiche <ArrowRight size={16} />
            </button>
          </div>

          {/* Card 2: Necrologie */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <FileText size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nécrologie</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Annonce officielle de décès, organisation des veillées, levée de corps et obsèques.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('submit')}
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Remplir la fiche <ArrowRight size={16} />
            </button>
          </div>

          {/* Card 3: Presentation d'enfant */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                backgroundColor: '#E0F2FE',
                color: '#0369A1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Baby size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Présentation d’Enfant</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Demande de présentation d'un nouveau-né au temple par la famille et la classe méthodiste.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('submit')}
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Remplir la fiche <ArrowRight size={16} />
            </button>
          </div>

          {/* Card 4: Reunion de classe */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Calendar size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Réunion de Classe</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Fiche de convocation et de rassemblement des membres d'une classe méthodiste.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('submit')}
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Remplir la fiche <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* Info Section */}
      <section className="container" style={{ marginTop: '4rem' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '2.5rem'
        }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', color: '#0F172A' }}>
            Comment fonctionne le suivi de votre demande ?
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <CheckCircle2 color="#107C41" size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Un <strong>numéro unique (ex: BET-2026-1001)</strong> vous est attribué lors de la soumission.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <CheckCircle2 color="#107C41" size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Tant que la fiche n'est pas validée et que la date d'événement n'est pas dépassée, vous pouvez <strong>modifier vos informations à tout moment</strong>.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <CheckCircle2 color="#107C41" size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Le secrétariat et le bureau du conseil valident ensuite votre fiche pour sa prise en compte dans le culte.</span>
            </li>
          </ul>
        </div>
      </section>

    </div>
  );
}
