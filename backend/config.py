import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

default_postgres = f"postgresql://{os.getenv('POSTGRES_USER', 'postgres')}:{os.getenv('POSTGRES_PASSWORD', 'postgre')}@{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/{os.getenv('POSTGRES_DB', 'priere_bethesda')}"

raw_db_uri = os.getenv('DATABASE_URL', default_postgres)
if raw_db_uri and raw_db_uri.startswith("postgres://"):
    raw_db_uri = raw_db_uri.replace("postgres://", "postgresql://", 1)

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'bethesda_secret_key_2026_super_secure')
    SQLALCHEMY_DATABASE_URI = raw_db_uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Assets & Storage paths
    ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
    STORAGE_DIR = os.path.join(BASE_DIR, 'storage')
    LOGO_PATH = os.path.join(ASSETS_DIR, 'eglise.png')

    # JWT Config
    JWT_SECRET_KEY = SECRET_KEY
    JWT_EXPIRATION_HOURS = 1
