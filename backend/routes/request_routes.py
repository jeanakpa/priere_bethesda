import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename
from datetime import date
from models import db
from models.request import PrayerRequest
from utils.helpers import generate_tracking_code, parse_date

request_bp = Blueprint('requests', __name__)

@request_bp.route('', methods=['POST'])
def submit_request():
    data = request.get_json() or {}
    form_type = data.get('form_type')
    details = data.get('details', {})

    if not form_type:
        return jsonify({'message': 'Le type de formulaire est requis.'}), 400

    # Extract common indexing fields safely
    methode_classe = data.get('methode_classe') or details.get('classe')
    conducteur = data.get('conducteur') or details.get('conducteur')
    
    demandeur_nom = (
        data.get('demandeur_nom') or 
        details.get('demandeur') or 
        details.get('famille') or 
        details.get('nom_enfant') or 
        (f"Réunion {methode_classe}" if methode_classe else None) or
        conducteur or 
        "Non spécifié"
    )
    
    event_date_raw = data.get('event_date') or details.get('date_priere') or details.get('date_presentation') or details.get('date_reunion') or details.get('date_enterrement') or details.get('decede_le')
    event_date = parse_date(event_date_raw)

    # Generate unique code
    tracking_code = generate_tracking_code()
    while PrayerRequest.query.filter_by(tracking_code=tracking_code).first():
        tracking_code = generate_tracking_code()

    new_req = PrayerRequest(
        tracking_code=tracking_code,
        form_type=form_type,
        status='Nouveau',
        is_validated=False,
        methode_classe=methode_classe,
        conducteur=conducteur,
        demandeur_nom=demandeur_nom,
        reception_date=date.today(),
        event_date=event_date,
        details=details
    )

    db.session.add(new_req)
    db.session.commit()

    return jsonify({
        'message': 'Votre fiche a été enregistrée avec succès !',
        'request': new_req.to_dict()
    }), 201


@request_bp.route('/track/<tracking_code>', methods=['GET'])
def track_request(tracking_code):
    req = PrayerRequest.query.filter_by(tracking_code=tracking_code.upper().strip()).first()
    if not req:
        return jsonify({'message': f'Aucune fiche trouvée avec le code {tracking_code}.'}), 404

    return jsonify({'request': req.to_dict()}), 200


@request_bp.route('/track/<tracking_code>', methods=['PUT'])
def edit_request(tracking_code):
    req = PrayerRequest.query.filter_by(tracking_code=tracking_code.upper().strip()).first()
    if not req:
        return jsonify({'message': f'Aucune fiche trouvée avec le code {tracking_code}.'}), 404

    if not req.is_editable():
        return jsonify({
            'message': 'Modification impossible : Cette fiche a déjà été validée par le secrétariat ou la date de l\'événement est déjà passée.'
        }), 403

    data = request.get_json() or {}
    details = data.get('details', req.details)

    req.methode_classe = data.get('methode_classe', req.methode_classe) or details.get('classe')
    req.conducteur = data.get('conducteur', req.conducteur) or details.get('conducteur')
    req.demandeur_nom = data.get('demandeur_nom', req.demandeur_nom) or details.get('demandeur') or details.get('famille') or details.get('nom_enfant')
    
    event_date_raw = data.get('event_date') or details.get('date_priere') or details.get('date_presentation') or details.get('date_reunion') or details.get('date_enterrement') or details.get('decede_le')
    if event_date_raw:
        req.event_date = parse_date(event_date_raw)

    req.details = details
    db.session.commit()

    return jsonify({
        'message': 'Fiche mise à jour avec succès !',
        'request': req.to_dict()
    }), 200


@request_bp.route('/upload_photo', methods=['POST'])
def upload_photo():
    if 'photo' not in request.files and 'file' not in request.files:
        return jsonify({'message': 'Aucun fichier photo fourni.'}), 400

    file = request.files.get('photo') or request.files.get('file')
    if not file or file.filename == '':
        return jsonify({'message': 'Nom de fichier vide.'}), 400

    allowed_extensions = {'png', 'jpg', 'jpeg', 'webp'}
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in allowed_extensions:
        return jsonify({'message': 'Format de fichier non autorisé. Formats acceptés : PNG, JPEG, JPG, WEBP.'}), 400

    upload_folder = os.path.join(current_app.config['STORAGE_DIR'], 'uploads')
    os.makedirs(upload_folder, exist_ok=True)

    filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    photo_url = f"/api/requests/uploads/{filename}"

    return jsonify({
        'message': 'Photo téléversée avec succès.',
        'filename': filename,
        'url': photo_url
    }), 201


@request_bp.route('/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    upload_folder = os.path.join(current_app.config['STORAGE_DIR'], 'uploads')
    return send_from_directory(upload_folder, filename)
