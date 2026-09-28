from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=True)
    role = db.Column(db.String(30), default='conducteur') # 'conducteur', 'president_conducteur', 'secretariat'
    methode_classe = db.Column(db.String(120), nullable=True)
    phone_number = db.Column(db.String(30), default='+2250708729293')
    
    # OTP 2FA fields
    otp_code = db.Column(db.String(10), nullable=True)
    otp_created_at = db.Column(db.DateTime, nullable=True)
    otp_attempts = db.Column(db.Integer, default=0)
    otp_blocked_until = db.Column(db.DateTime, nullable=True)

    must_change_password = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        is_default_pass = self.check_password('123456')
        must_change = getattr(self, 'must_change_password', True)
        if must_change is None:
            must_change = True
        return {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name or self.username,
            'role': self.role,
            'methode_classe': self.methode_classe,
            'phone_number': self.phone_number,
            'must_change_password': must_change or is_default_pass,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

