# this is where i give database credentials

import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_secret_key')
    DEBUG = True

    DB_USER="nik"
    DB_PASSWORD="nik05"
    DB_HOST="localhost"
    DB_PORT="5432"
    DB_NAME="hack1"

    SQLALCHEMY_DATABASE_URI=(
        f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    )

    SQLALCHEMY_TRACK_MODIFICATIONS= True