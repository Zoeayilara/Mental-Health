from flask import Blueprint, request, jsonify, session
from database import get_db

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/history', methods=['GET'])
def get_history():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'error': 'Not authenticated'}), 401

    db = get_db()
    try:
        msgs = db.execute(
            "SELECT role, content, created_at FROM messages WHERE user_id=? ORDER BY created_at ASC LIMIT 100",
            (uid,)
        ).fetchall()
        return jsonify([{'role': m['role'], 'content': m['content'], 'created_at': m['created_at']} for m in msgs])
    finally:
        db.close()

@chat_bp.route('/save', methods=['POST'])
def save_message():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'error': 'Not authenticated'}), 401

    data    = request.get_json()
    role    = data.get('role')
    content = data.get('content')

    if role not in ('user', 'assistant') or not content:
        return jsonify({'error': 'Invalid message'}), 400

    db = get_db()
    try:
        db.execute(
            'INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)',
            (uid, role, content)
        )
        db.commit()
        return jsonify({'message': 'Saved'}), 201
    finally:
        db.close()

@chat_bp.route('/clear', methods=['DELETE'])
def clear_history():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'error': 'Not authenticated'}), 401

    db = get_db()
    try:
        db.execute('DELETE FROM messages WHERE user_id=?', (uid,))
        db.commit()
        return jsonify({'message': 'Chat history cleared'})
    finally:
        db.close()
