from datetime import datetime, date
from . import db

class PrayerRequest(db.Model):
    __tablename__ = 'prayer_requests'

    id = db.Column(db.Integer, primary_key=True)
    tracking_code = db.Column(db.String(30), unique=True, nullable=False, index=True)
    form_type = db.Column(db.String(50), nullable=False, index=True) # DEMANDE_PRIERE, NECROLOGIE, PRESENTATION_ENFANT, REUNION_CLASSE
    status = db.Column(db.String(30), default='Nouveau', index=True) # Nouveau, En cours, Validé, Traité, Archivé
    is_validated = db.Column(db.Boolean, default=False)
    
    # Common indexed filter fields
    methode_classe = db.Column(db.String(100), nullable=True, index=True)
    conducteur = db.Column(db.String(150), nullable=True)
    demandeur_nom = db.Column(db.String(150), nullable=True)
    
    reception_date = db.Column(db.Date, default=date.today, index=True)
    event_date = db.Column(db.Date, nullable=True, index=True) # Date indicated/event date for edit logic & filters
    
    # Flexible JSON storage for form-specific attributes
    details = db.Column(db.JSON, nullable=False, default={})

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def is_editable(self):
        """
        Calculates if the request can still be edited by the user:
        - Must NOT be validated by the secretariat yet (is_validated == False)
        - The event date / indication date must NOT have passed (event_date >= today or no event_date)
        """
        if self.is_validated:
            return False
        if self.event_date and self.event_date < date.today():
            return False
        return True

    def to_dict(self):
        return {
            'id': self.id,
            'tracking_code': self.tracking_code,
            'form_type': self.form_type,
            'status': self.status,
            'is_validated': self.is_validated,
            'methode_classe': self.methode_classe,
            'conducteur': self.conducteur,
            'demandeur_nom': self.demandeur_nom,
            'reception_date': self.reception_date.isoformat() if self.reception_date else None,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'details': self.details or {},
            'is_editable': self.is_editable(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
