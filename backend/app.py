import os
from flask import Flask
from flask_cors import CORS
from config import Config
from models import db
from routes import register_routes

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all routes (React frontend on 5173 / localhost)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Ensure storage and assets directories exist
    os.makedirs(app.config['STORAGE_DIR'], exist_ok=True)
    os.makedirs(app.config['ASSETS_DIR'], exist_ok=True)

    # Initialize DB
    db.init_app(app)

    # Register API blueprints
    register_routes(app)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'church': 'Temple Bethesda'}, 200

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)
