from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from app.config import Config

from app.extensions import db
from http_api.auth_routes import auth_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    cors=CORS(app, supports_credentials=True)

    app.register_blueprint(auth_bp, url_prefix='/auth')

    return app