from flask import Blueprint, request, jsonify, send_file, current_app
from sqlalchemy import or_, func, desc
from datetime import datetime
from models import db
from models.request import PrayerRequest
from utils.auth_middleware import token_required
from utils.helpers import parse_date
from services.export_service import ExportService

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/requests', methods=['GET'])
@token_required
def get_requests(current_user):
    query = PrayerRequest.query

    # Role restriction
    if current_user.role == 'conducteur':
        if current_user.methode_classe:
            query = query.filter(PrayerRequest.methode_classe == current_user.methode_classe)
        else:
            query = query.filter(PrayerRequest.conducteur.ilike(f"%{current_user.username}%"))

    # Filters
    form_type = request.args.get('form_type')
    methode_classe = request.args.get('methode_classe')
    status = request.args.get('status')
    search = request.args.get('search')
    
    reception_start = parse_date(request.args.get('reception_start'))
    reception_end = parse_date(request.args.get('reception_end'))
    
    event_start = parse_date(request.args.get('event_start'))
    event_end = parse_date(request.args.get('event_end'))

    if form_type:
        query = query.filter(PrayerRequest.form_type == form_type)
    if methode_classe:
        query = query.filter(PrayerRequest.methode_classe.ilike(f"%{methode_classe}%"))
    if status:
        query = query.filter(PrayerRequest.status == status)

    if reception_start:
        query = query.filter(PrayerRequest.reception_date >= reception_start)
    if reception_end:
        query = query.filter(PrayerRequest.reception_date <= reception_end)

    if event_start:
        query = query.filter(PrayerRequest.event_date >= event_start)
    if event_end:
        query = query.filter(PrayerRequest.event_date <= event_end)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                PrayerRequest.tracking_code.ilike(search_term),
                PrayerRequest.demandeur_nom.ilike(search_term),
                PrayerRequest.methode_classe.ilike(search_term),
                PrayerRequest.conducteur.ilike(search_term)
            )
        )

    # Sorting
    query = query.order_by(desc(PrayerRequest.created_at))

    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'requests': [req.to_dict() for req in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'per_page': pagination.per_page
    }), 200


@admin_bp.route('/requests/<int:req_id>/status', methods=['PUT'])
@token_required
def update_status(current_user, req_id):
    if current_user.role != 'secretariat':
        return jsonify({'message': 'Seul le Secrétariat peut modifier le statut des demandes.'}), 403

    req = PrayerRequest.query.get_or_404(req_id)
    data = request.get_json() or {}

    if 'status' in data:
        req.status = data['status']
    if 'is_validated' in data:
        req.is_validated = bool(data['is_validated'])

    db.session.commit()
    return jsonify({
        'message': 'Statut mis à jour avec succès.',
        'request': req.to_dict()
    }), 200


@admin_bp.route('/requests/<int:req_id>', methods=['DELETE'])
@token_required
def delete_request(current_user, req_id):
    if current_user.role != 'secretariat':
        return jsonify({'message': 'Seul le Secrétariat peut supprimer des fiches.'}), 403

    req = PrayerRequest.query.get_or_404(req_id)
    db.session.delete(req)
    db.session.commit()
    return jsonify({'message': 'Fiche supprimée avec succès.'}), 200


@admin_bp.route('/stats', methods=['GET'])
@token_required
def get_stats(current_user):
    query = PrayerRequest.query
    if current_user.role == 'conducteur':
        if current_user.methode_classe:
            query = query.filter(PrayerRequest.methode_classe == current_user.methode_classe)
        else:
            query = query.filter(PrayerRequest.conducteur.ilike(f"%{current_user.username}%"))

    total_requests = query.count()
    
    # Distribution by Form Type
    by_type_query = db.session.query(PrayerRequest.form_type, func.count(PrayerRequest.id))
    if current_user.role == 'conducteur':
        if current_user.methode_classe:
            by_type_query = by_type_query.filter(PrayerRequest.methode_classe == current_user.methode_classe)
    by_type_raw = by_type_query.group_by(PrayerRequest.form_type).all()
    by_type = {t: count for t, count in by_type_raw}

    # Distribution by Methodist Class
    by_class_query = db.session.query(PrayerRequest.methode_classe, func.count(PrayerRequest.id)).filter(PrayerRequest.methode_classe.isnot(None))
    if current_user.role == 'conducteur':
        if current_user.methode_classe:
            by_class_query = by_class_query.filter(PrayerRequest.methode_classe == current_user.methode_classe)
    by_class_raw = by_class_query.group_by(PrayerRequest.methode_classe).all()
    by_class = {c or 'Non spécifiée': count for c, count in by_class_raw}

    # Distribution by Status
    by_status_query = db.session.query(PrayerRequest.status, func.count(PrayerRequest.id))
    if current_user.role == 'conducteur':
        if current_user.methode_classe:
            by_status_query = by_status_query.filter(PrayerRequest.methode_classe == current_user.methode_classe)
    by_status_raw = by_status_query.group_by(PrayerRequest.status).all()
    by_status = {s: count for s, count in by_status_raw}

    # Unique Methodist Classes list for admin filter dropdown
    unique_classes = [c[0] for c in db.session.query(PrayerRequest.methode_classe).filter(PrayerRequest.methode_classe.isnot(None)).distinct().all() if c[0]]

    return jsonify({
        'total': total_requests,
        'by_type': by_type,
        'by_class': by_class,
        'by_status': by_status,
        'available_classes': sorted(unique_classes)
    }), 200


@admin_bp.route('/requests/<int:req_id>/export/word', methods=['GET'])
@token_required
def export_word(current_user, req_id):
    req = PrayerRequest.query.get_or_404(req_id)
    logo_path = current_app.config['LOGO_PATH']

    doc_io = ExportService.generate_word(req, logo_path)
    filename = f"Fiche_{req.tracking_code}_{req.form_type}.docx"

    return send_file(
        doc_io,
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        as_attachment=True,
        download_name=filename
    )


@admin_bp.route('/requests/<int:req_id>/export/pdf', methods=['GET'])
@token_required
def export_pdf(current_user, req_id):
    req = PrayerRequest.query.get_or_404(req_id)
    logo_path = current_app.config['LOGO_PATH']

    pdf_io = ExportService.generate_pdf(req, logo_path)
    filename = f"Fiche_{req.tracking_code}_{req.form_type}.pdf"

    return send_file(
        pdf_io,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )


from models.user import User
from routes.auth_routes import validate_strong_password

@admin_bp.route('/users', methods=['GET'])
@token_required
def get_users(current_user):
    if current_user.role != 'secretariat':
        return jsonify({'message': 'Seul le Secrétariat peut accéder à la gestion des utilisateurs.'}), 403

    sec_password = request.headers.get('X-Secretary-Password') or request.args.get('sec_password')
    include_passwords = False

    if sec_password and current_user.check_password(sec_password):
        include_passwords = True

    users = User.query.order_by(User.role, User.username).all()
    return jsonify({
        'users': [u.to_dict(include_password=include_passwords) for u in users],
        'unlocked': include_passwords
    }), 200

@admin_bp.route('/users/verify-password', methods=['POST'])
@token_required
def verify_secretary_password(current_user):
    if current_user.role != 'secretariat':
        return jsonify({'message': 'Accès réservé au Secrétariat.'}), 403

    data = request.get_json() or {}
    password = data.get('password')

    if not password or not current_user.check_password(password):
        return jsonify({'message': 'Mot de passe du Secrétariat incorrect. Confirmation refusée.'}), 401

    return jsonify({'message': 'Mot de passe du Secrétariat confirmé avec succès !', 'unlocked': True}), 200

@admin_bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@token_required
def reset_user_password(current_user, user_id):
    if current_user.role != 'secretariat':
        return jsonify({'message': 'Seul le Secrétariat peut modifier le mot de passe d\'un utilisateur.'}), 403

    data = request.get_json() or {}
    sec_password = data.get('sec_password')
    new_password = data.get('new_password')

    if not sec_password or not current_user.check_password(sec_password):
        return jsonify({'message': 'Mot de passe du Secrétariat incorrect. Veuillez confirmer votre propre mot de passe pour valider.'}), 401

    if not new_password:
        return jsonify({'message': 'Veuillez fournir le nouveau mot de passe fort.'}), 400

    is_valid, err_msg = validate_strong_password(new_password)
    if not is_valid:
        return jsonify({'message': err_msg}), 400

    target_user = User.query.get_or_404(user_id)
    target_user.set_password(new_password)
    target_user.must_change_password = False
    db.session.commit()

    return jsonify({
        'message': f'Le mot de passe de {target_user.full_name or target_user.username} a été réinitialisé avec succès !',
        'user': target_user.to_dict(include_password=True)
    }), 200
