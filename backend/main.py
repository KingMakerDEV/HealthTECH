from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.extensions import db

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    # ✅ FIXED CORS CONFIG
    CORS(
        app,
        resources={r"/auth/*": {"origins": "http://localhost:5173"}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    db.init_app(app)

    from http_api.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
