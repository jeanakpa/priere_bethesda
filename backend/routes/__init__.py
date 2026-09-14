from .auth_routes import auth_bp
from .request_routes import request_bp
from .admin_routes import admin_bp

def register_routes(app):
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(request_bp, url_prefix='/api/requests')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
