import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'bethesda_secret_key_2026_super_secure')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/priere_bethesda')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Assets & Storage paths
    ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
    STORAGE_DIR = os.path.join(BASE_DIR, 'storage')
    LOGO_PATH = os.path.join(ASSETS_DIR, 'eglise.png')

    # JWT Config
    JWT_SECRET_KEY = SECRET_KEY
    JWT_EXPIRATION_HOURS = 1
