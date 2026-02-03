from backend.app.extensions import db

class Doctor_user(db.Model):
    __tablename__="doctor_user"
    id= db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(250), unique=True, nullable=False)
    password = db.Column(db.String(250), nullable=False)
    name = db.Column(db.String(250), nullable=False)
    speciality = db.Column(db.String(250), nullable=False)
    designation = db.Column(db.String(250), nullable=False)

class Patient_user(db.Model):
    __tablename__="patient_user"
    id= db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(250), unique=True, nullable=False)
    password = db.Column(db.String(250), nullable=False)
    name = db.Column(db.String(250), nullable=False)
    age =db.Cloumn(db.Integer, nullable=False)


