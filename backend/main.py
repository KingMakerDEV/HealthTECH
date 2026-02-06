from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from app.config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    # ✅ IMPORTANT: enable CORS properly
    CORS(app, resources={r"/*": {"origins": "*"}})

    db.init_app(app)

    # import and register routes
    from http_api.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")

    return app
