from flask import Blueprint, request, jsonify, session, send_from_directory
from database import get_db
import hashlib, os, uuid
from werkzeug.utils import secure_filename

user_bp = Blueprint('user', __name__)

ALLOWED = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED

def get_current_user():
    uid = session.get('user_id')
    if not uid:
        return None
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (uid,)).fetchone()
    db.close()
    return user

@user_bp.route('/profile', methods=['PUT'])
def update_profile():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.get_json()
    name  = data.get('name', user['name']).strip()
    bio   = data.get('bio', user['bio'])
    age   = data.get('age', user['age'])
    topic = data.get('topic', user['topic'])
    theme = data.get('theme', user['theme'])

    if not name:
        return jsonify({'error': 'Name cannot be empty'}), 400

    db = get_db()
    try:
        db.execute(
            'UPDATE users SET name=?, bio=?, age=?, topic=?, theme=? WHERE id=?',
            (name, bio, age, topic, theme, user['id'])
        )
        db.commit()
        updated = db.execute('SELECT * FROM users WHERE id=?', (user['id'],)).fetchone()
        return jsonify({
            'id': updated['id'], 'name': updated['name'], 'email': updated['email'],
            'bio': updated['bio'], 'age': updated['age'], 'avatar': updated['avatar'],
            'topic': updated['topic'], 'theme': updated['theme'],
        })
    finally:
        db.close()

@user_bp.route('/avatar', methods=['POST'])
def upload_avatar():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    if 'avatar' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['avatar']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"avatar_{user['id']}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join('uploads', filename)
    file.save(filepath)

    # Delete old avatar
    if user['avatar']:
        old = os.path.join('uploads', user['avatar'])
        if os.path.exists(old):
            os.remove(old)

    db = get_db()
    try:
        db.execute('UPDATE users SET avatar=? WHERE id=?', (filename, user['id']))
        db.commit()
        return jsonify({'avatar': filename})
    finally:
        db.close()

@user_bp.route('/avatar/<filename>')
def get_avatar(filename):
    return send_from_directory('uploads', filename)

@user_bp.route('/password', methods=['PUT'])
def change_password():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.get_json()
    current  = data.get('current', '')
    new_pass = data.get('new', '')

    if not current or not new_pass:
        return jsonify({'error': 'All fields required'}), 400
    if len(new_pass) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400

    hashed_current = hashlib.sha256(current.encode()).hexdigest()
    if hashed_current != user['password_hash']:
        return jsonify({'error': 'Current password is incorrect'}), 401

    db = get_db()
    try:
        db.execute(
            'UPDATE users SET password_hash=? WHERE id=?',
            (hashlib.sha256(new_pass.encode()).hexdigest(), user['id'])
        )
        db.commit()
        return jsonify({'message': 'Password updated successfully'})
    finally:
        db.close()
