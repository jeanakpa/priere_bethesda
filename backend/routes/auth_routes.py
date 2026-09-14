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

    # Check if currently blocked
    now = datetime.utcnow()
    if user.otp_blocked_until and user.otp_blocked_until > now:
        remaining_sec = int((user.otp_blocked_until - now).total_seconds())
        return jsonify({
            'message': f'Compte temporairement bloqué suite à 5 tentatives infructueuses. Veuillez patienter {remaining_sec} secondes.',
            'blocked_for_seconds': remaining_sec
        }), 429

    # Generate 4-digit OTP
    otp = f"{random.randint(1000, 9999)}"
    user.otp_code = otp
    user.otp_created_at = now
    db.session.commit()

    # Send SMS via Infobip API
    target_phone = user.phone_number or "+2250556936994"
    SmsService.send_otp_sms(target_phone, otp)

    # Return partial response requesting OTP
    masked_phone = target_phone[-5:] if len(target_phone) >= 5 else target_phone
    return jsonify({
        'require_otp': True,
        'username': user.username,
        'phone_masked': f"...{masked_phone}",
        'message': f'Code OTP à 4 chiffres envoyé au +{target_phone.replace("+", "")}.'
    }), 200

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip().lower()
    otp_code = (data.get('otp_code') or '').strip()

    if not username or not otp_code:
        return jsonify({'message': 'Code OTP à 4 chiffres requis.'}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'Utilisateur introuvable.'}), 404

    now = datetime.utcnow()

    # Check if blocked
    if user.otp_blocked_until and user.otp_blocked_until > now:
        remaining_sec = int((user.otp_blocked_until - now).total_seconds())
        return jsonify({
            'message': f'Compte temporairement bloqué suite à 5 tentatives infructueuses. Veuillez patienter {remaining_sec} secondes.',
            'blocked_for_seconds': remaining_sec
        }), 429

    # Check OTP correctness
    if user.otp_code and user.otp_code == otp_code:
        # Success! Reset attempts and block status
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
        if user.otp_attempts >= 5:
            user.otp_blocked_until = now + timedelta(seconds=30)
            user.otp_attempts = 0 # Reset count for next cycle after block
            db.session.commit()
            return jsonify({
                'message': '5 tentatives échouées. Compte bloqué pendant 30 secondes.',
                'blocked_for_seconds': 30
            }), 429
        else:
            db.session.commit()
            remaining = 5 - user.otp_attempts
            return jsonify({
                'message': f'Code OTP incorrect. Il vous reste {remaining} tentative(s).',
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

