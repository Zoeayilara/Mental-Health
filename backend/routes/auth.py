from flask import Blueprint, request, jsonify, session
from database import get_db
import hashlib
import re

auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def validate_email(email):
    return re.match(r'^[^@]+@[^@]+\.[^@]+$', email)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if not validate_email(email):
        return jsonify({'error': 'Invalid email address'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    db = get_db()
    try:
        db.execute(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            (name, email, hash_password(password))
        )
        db.commit()
        user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        session['user_id'] = user['id']
        return jsonify({
            'message': 'Account created successfully',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'avatar': user['avatar'],
                'topic': user['topic'],
                'theme': user['theme'],
            }
        }), 201
    except Exception as e:
        if 'UNIQUE' in str(e):
            return jsonify({'error': 'An account with this email already exists'}), 409
        return jsonify({'error': 'Something went wrong'}), 500
    finally:
        db.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    db = get_db()
    try:
        user = db.execute(
            'SELECT * FROM users WHERE email = ? AND password_hash = ?',
            (email, hash_password(password))
        ).fetchone()

        if not user:
            return jsonify({'error': 'Incorrect email or password'}), 401

        session['user_id'] = user['id']
        return jsonify({
            'message': 'Logged in successfully',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'avatar': user['avatar'],
                'topic': user['topic'],
                'theme': user['theme'],
            }
        }), 200
    finally:
        db.close()

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'}), 200

@auth_bp.route('/me', methods=['GET'])
def me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    db = get_db()
    try:
        user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify({
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'bio': user['bio'],
            'age': user['age'],
            'avatar': user['avatar'],
            'topic': user['topic'],
            'theme': user['theme'],
            'created_at': user['created_at'],
        })
    finally:
        db.close()
