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
