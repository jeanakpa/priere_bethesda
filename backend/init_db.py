import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from datetime import date, datetime
from app import create_app
from models import db
from models.user import User
from models.request import PrayerRequest
from utils.helpers import generate_tracking_code

DB_NAME = "priere_bethesda"
PG_USER = os.getenv("POSTGRES_USER", "postgres")
PG_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")
PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = os.getenv("POSTGRES_PORT", "5432")

def create_database_if_not_exists():
    print("Verification et creation de la base de donnees PostgreSQL...")
    passwords_to_try = [PG_PASS, "", "postgres", "admin", "root"]
    conn = None
    
    for pwd in passwords_to_try:
        try:
            conn = psycopg2.connect(
                dbname="postgres",
                user=PG_USER,
                password=pwd,
                host=PG_HOST,
                port=PG_PORT
            )
            print(f"Connexion PostgreSQL reussie avec l'utilisateur '{PG_USER}'.")
            break
        except Exception as e:
            continue

    if not conn:
        print("Impossible de se connecter au serveur PostgreSQL default. Assurez-vous que PostgreSQL est running.")
        return False

    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (DB_NAME,))
    exists = cursor.fetchone()

    if not exists:
        print(f"Creation de la base de donnees '{DB_NAME}'...")
        cursor.execute(f'CREATE DATABASE "{DB_NAME}"')
        print(f"Base de donnees '{DB_NAME}' creee avec succes !")
    else:
        print(f"La base de donnees '{DB_NAME}' existe deja.")

    cursor.close()
    conn.close()
    return True

def init_tables_and_seed():
    app = create_app()
    with app.app_context():
        print("Mise à jour des tables de la base de données...")
        db.drop_all()
        db.create_all()

        DEFAULT_PASS = "123456"
        TARGET_PHONE = "+2250556936994"

        # 1. Seed Secretariat user (leonceaka)
        sec = User.query.filter_by(username='leonceaka').first()
        if not sec:
            print("Création du compte Secrétariat : leonceaka...")
            sec = User(
                username='leonceaka',
                full_name='Léonce AKA (Secrétariat)',
                role='secretariat',
                methode_classe='Secrétariat du Conseil',
                phone_number=TARGET_PHONE
            )
            sec.set_password(DEFAULT_PASS)
            db.session.add(sec)
        else:
            sec.role = 'secretariat'
            sec.phone_number = TARGET_PHONE
            sec.set_password(DEFAULT_PASS)

        # 2. Seed Président des Conducteurs (assekemarc)
        pres = User.query.filter_by(username='assekemarc').first()
        if not pres:
            print("Création du compte Président des Conducteurs : assekemarc...")
            pres = User(
                username='assekemarc',
                full_name='Asséké Marc (Président des Conducteurs)',
                role='president_conducteur',
                methode_classe='BÉTHANIE',
                phone_number=TARGET_PHONE
            )
            pres.set_password(DEFAULT_PASS)
            db.session.add(pres)
        else:
            pres.role = 'president_conducteur'
            pres.phone_number = TARGET_PHONE
            pres.set_password(DEFAULT_PASS)

        # 3. Seed Conducteurs for all classes
        conducteurs_list = [
            ("grahadjorose", "Grah Adjo Rose", "BÉTHEL"),
            ("dezamadeleine", "Deza Madeleine / Mamikre Pierre", "BETHLEEM"),
            ("adoueupfrasie", "Adou Euphrasie / Seka Gérard", "BÉNÉDICTION"),
            ("yandemonique", "Yandé Monique", "CANAAN"),
            ("essismartine", "Essis Martine", "CITÉ DE GRÂCES"),
            ("akaangeline", "Aka Angéline", "CAPERNAÜM"),
            ("kassijeanne", "Kassi Jeanne", "DIVINE GRÂCE"),
            ("niavajocelyne", "Niava Jocelyne / Achiepo Ulrich", "EDEN"),
            ("logbouella", "Logbou Ella / Wadjo Joséphine", "GALILÉE"),
            ("kouadiotaiki", "Kouadio Taiki Simon", "HOREB"),
            ("ehoussouagathe", "Ehoussou Agathe", "ISRAËL"),
            ("kragbeemmanuel", "Kragbé Emmanuel", "JÉRAKMEEL"),
            ("adjaehuamadeleine", "Adja Ehua Madeleine", "IMMENSE GRÂCE"),
            ("kouakouagaleonce", "Kouakou Aga Léonce", "JÉRICHO"),
            ("melyouprudence", "Mel You Prudence", "JOHN WESLEY"),
            ("yedohjosephine", "Yedoh Joséphine / Okou Essis Jeannot / Kouassi Moïse", "JOURDAIN"),
            ("akremarthe", "Akre Marthe", "JÉHOVAH SABBAOTH"),
            ("ntakpeodette", "N'takpé Odette", "MAISON DE GRÂCES"),
            ("blemohoupaulette", "Blé Mohou Paulette", "MISÉRICORDE"),
            ("adoumichel", "Adou Michel", "NOUVELLE JÉRUSALEM"),
            ("essohnomelmatthieu", "Essoh Nomel Matthieu", "NAZARETH"),
            ("akassiangele", "Akassi Angèle", "PARADIS"),
            ("kouadioanderson", "Kouadio Anderson", "PENIEL"),
            ("djedjehortense", "Djedje Hortense", "SALUT PAR GRÂCE"),
            ("sablemariesolange", "Sable Marie Solange", "SCHEKINAËL"),
            ("adjebarthelemy", "Adjé Barthélémy", "SILO"),
            ("nomelannette", "Nomel Annette", "SINAÏ"),
            ("petekall", "Pete Kall", "UNION DES HOMMES"),
            ("quansahraissa", "Quansah Raïssa", "UNION DES FEMMES"),
            ("nkpomansandrine", "N’kpoman Sandrine", "JEUNESSE"),
            ("kpeyajephte", "Kpeya Jephté", "ECODIM")
        ]

        for u_name, f_name, c_name in conducteurs_list:
            cond = User.query.filter_by(username=u_name).first()
            if not cond:
                cond = User(
                    username=u_name,
                    full_name=f_name,
                    role='conducteur',
                    methode_classe=c_name,
                    phone_number=TARGET_PHONE
                )
                cond.set_password(DEFAULT_PASS)
                db.session.add(cond)
            else:
                cond.set_password(DEFAULT_PASS)
                cond.phone_number = TARGET_PHONE

        db.session.commit()
        print("Comptes utilisateurs initialisés avec succès !")

        # Seed Sample Data if empty
        if PrayerRequest.query.count() == 0:
            print("Insertion des données de démonstration...")
            sample_data = [
                {
                    'tracking_code': 'BET-2026-1001',
                    'form_type': 'DEMANDE_PRIERE',
                    'status': 'Nouveau',
                    'is_validated': False,
                    'methode_classe': 'JOURDAIN',
                    'conducteur': 'Yedoh Joséphine',
                    'demandeur_nom': 'Sœur KOUASSI Aminata',
                    'reception_date': date.today(),
                    'event_date': date(2026, 9, 20),
                    'details': {
                        'date_priere': '2026-09-20',
                        'priere_soutien': True,
                        'priere_guerison': True,
                        'priere_action_grace': False,
                        'classe': 'JOURDAIN',
                        'conducteur': 'Yedoh Joséphine',
                        'demandeur': 'Sœur KOUASSI Aminata',
                        'sujet': 'Demande de prière de guérison pour ma santé physique et de soutien pour le concours d\'entrée à la fonction publique.',
                        'fait_a_date': '2026-09-14'
                    }
                },
                {
                    'tracking_code': 'BET-2026-1002',
                    'form_type': 'NECROLOGIE',
                    'status': 'Validé',
                    'is_validated': True,
                    'methode_classe': 'BÉTHANIE',
                    'conducteur': 'Asséké Marc',
                    'demandeur_nom': 'Famille YAO à Niangon',
                    'reception_date': date.today(),
                    'event_date': date(2026, 9, 25),
                    'details': {
                        'famille': 'Famille YAO à Niangon et Abidjan',
                        'classe': 'BÉTHANIE',
                        'sexe_defunt': 'Masculin',
                        'frere_soeur': 'Feu Frère YAO Kouadio Pierre',
                        'decede_le': '2026-09-10',
                        'lieu_deces': 'CHU de Yopougon',
                        'lieu_veillee': 'Préau du Temple Bethesda',
                        'lieu_levee': 'Morgue d\'Anyama',
                        'date_enterrement': '2026-09-25',
                        'lieu_enterrement': 'Cimetière Municipal de Yopougon',
                        'fait_a_date': '2026-09-14',
                        'veillees': [
                            {'titre': 'Veillée 1', 'lieu_date': 'Veillée religieuse le 20/09/2026 à 19h au Temple Bethesda'},
                            {'titre': 'Veillée 2', 'lieu_date': 'Veillée traditionnelle le 24/09/2026 à 21h à la place publique'}
                        ]
                    }
                }
            ]

            for d in sample_data:
                req = PrayerRequest(**d)
                db.session.add(req)
            db.session.commit()
            print("Données d'exemple insérées avec succès !")

if __name__ == "__main__":
    if create_database_if_not_exists():
        init_tables_and_seed()
        print("Initialisation terminée avec succès !")
