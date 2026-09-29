import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from services.sms_service import SmsService
from utils.auth_middleware import generate_jwt_token, token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip().lower()
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Veuillez fournir le nom d\'utilisateur et le mot de passe.'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Nom d\'utilisateur ou mot de passe incorrect.'}), 401

    # Direct login without OTP SMS
    token = generate_jwt_token(user.id, user.username, user.role)
    return jsonify({
        'message': 'Authentification réussie !',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip().lower()
    otp_code = (data.get('otp_code') or '').strip()

    if not username or not otp_code:
        return jsonify({'message': 'Code de validation à 4 chiffres requis.'}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'Utilisateur introuvable.'}), 404

    now = datetime.utcnow()

    # Check 30 seconds expiration delay
    if user.otp_created_at:
        elapsed_sec = (now - user.otp_created_at).total_seconds()
        if elapsed_sec > 30:
            user.otp_code = None
            db.session.commit()
            return jsonify({
                'message': 'Le code de validation a expiré (délai de 30 secondes dépassé). Veuillez demander un nouveau code.',
                'expired': True
            }), 400

    # Check OTP correctness
    if user.otp_code and user.otp_code == otp_code:
        # Success! Reset attempts and code
        user.otp_attempts = 0
        user.otp_code = None
        user.otp_blocked_until = None
        db.session.commit()

        token = generate_jwt_token(user.id, user.username, user.role)
        return jsonify({
            'message': 'Authentification réussie !',
            'token': token,
            'user': user.to_dict()
        }), 200
    else:
        # Failed attempt
        user.otp_attempts = (user.otp_attempts or 0) + 1
        if user.otp_attempts >= 3:
            user.otp_attempts = 0
            user.otp_code = None
            db.session.commit()
            return jsonify({
                'message': '3 tentatives échouées. Redirection vers la page des identifiants.',
                'redirect_credentials': True
            }), 400
        else:
            db.session.commit()
            remaining = 3 - user.otp_attempts
            return jsonify({
                'message': f'Code incorrect. Il vous reste {remaining} tentative(s).',
                'remaining_attempts': remaining
            }), 400

@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip().lower()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'Utilisateur introuvable.'}), 404

    now = datetime.utcnow()
    if user.otp_blocked_until and user.otp_blocked_until > now:
        remaining_sec = int((user.otp_blocked_until - now).total_seconds())
        return jsonify({
            'message': f'Veuillez patienter {remaining_sec} secondes avant de demander un nouveau code.',
            'blocked_for_seconds': remaining_sec
        }), 429

    otp = f"{random.randint(1000, 9999)}"
    user.otp_code = otp
    user.otp_created_at = now
    db.session.commit()

    target_phone = user.phone_number or "+2250708729293"
    SmsService.send_otp_sms(target_phone, otp)

    return jsonify({'message': 'Nouveau code OTP envoyé avec succès.'}), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({'user': current_user.to_dict()}), 200


import re

def validate_strong_password(password):
    if not password or len(password) < 8:
        return False, "Le mot de passe doit comporter au moins 8 caractères."
    if not re.search(r'[A-Z]', password):
        return False, "Le mot de passe doit contenir au moins une lettre majuscule (A-Z)."
    if not re.search(r'[a-z]', password):
        return False, "Le mot de passe doit contenir au moins une lettre minuscule (a-z)."
    if not re.search(r'[0-9]', password):
        return False, "Le mot de passe doit contenir au moins un chiffre (0-9)."
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~`]', password):
        return False, "Le mot de passe doit contenir au moins un symbole spécial (ex: @, #, !, $, %, *)."
    if password == '123456':
        return False, "Vous ne pouvez pas réutiliser le mot de passe par défaut 123456."
    return True, ""

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.get_json() or {}
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    if not new_password or not confirm_password:
        return jsonify({'message': 'Veuillez fournir et confirmer le nouveau mot de passe.'}), 400

    if new_password != confirm_password:
        return jsonify({'message': 'Les deux mots de passe ne correspondent pas.'}), 400

    is_valid, err_msg = validate_strong_password(new_password)
    if not is_valid:
        return jsonify({'message': err_msg}), 400

    current_user.set_password(new_password)
    current_user.must_change_password = False
    db.session.commit()

    return jsonify({
        'message': 'Votre mot de passe a été modifié avec succès !',
        'user': current_user.to_dict()
    }), 200

