from flask import Blueprint, request, jsonify, session
from database import get_db
from datetime import datetime, timedelta

mood_bp = Blueprint('mood', __name__)

MOOD_SCORES = {
    'happy':   90,
    'calm':    80,
    'tired':   55,
    'anxious': 45,
    'sad':     35,
    'angry':   30,
}

def require_auth():
    uid = session.get('user_id')
    if not uid:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return uid, None, None

@mood_bp.route('/log', methods=['POST'])
def log_mood():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'error': 'Not authenticated'}), 401

    data  = request.get_json()
    mood  = data.get('mood', '').lower()
    note  = data.get('note', '')
    score = MOOD_SCORES.get(mood, 50)

    if not mood:
        return jsonify({'error': 'Mood is required'}), 400

    db = get_db()
    try:
        db.execute(
            'INSERT INTO moods (user_id, mood, note, score) VALUES (?, ?, ?, ?)',
            (uid, mood, note, score)
        )
        db.commit()
        return jsonify({'message': 'Mood logged', 'score': score}), 201
    finally:
        db.close()

@mood_bp.route('/today', methods=['GET'])
def today_mood():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'error': 'Not authenticated'}), 401

    db = get_db()
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        entry = db.execute(
            "SELECT * FROM moods WHERE user_id=? AND DATE(created_at)=? ORDER BY created_at DESC LIMIT 1",
            (uid, today)
        ).fetchone()
        if entry:
            return jsonify({'mood': entry['mood'], 'score': entry['score'], 'note': entry['note']})
        return jsonify({'mood': None})
    finally:
        db.close()

@mood_bp.route('/week', methods=['GET'])
def week_moods():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'error': 'Not authenticated'}), 401

    db = get_db()
    try:
        days = []
        for i in range(6, -1, -1):
            day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            label = (datetime.now() - timedelta(days=i)).strftime('%a')
            entry = db.execute(
                "SELECT AVG(score) as avg_score FROM moods WHERE user_id=? AND DATE(created_at)=?",
                (uid, day)
            ).fetchone()
            avg = round(entry['avg_score']) if entry['avg_score'] else 0
            days.append({'day': label, 'date': day, 'score': avg})
        return jsonify(days)
    finally:
        db.close()

@mood_bp.route('/history', methods=['GET'])
def mood_history():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'error': 'Not authenticated'}), 401

    db = get_db()
    try:
        entries = db.execute(
            "SELECT * FROM moods WHERE user_id=? ORDER BY created_at DESC LIMIT 30",
            (uid,)
        ).fetchall()
        return jsonify([{
            'id': e['id'], 'mood': e['mood'], 'score': e['score'],
            'note': e['note'], 'created_at': e['created_at']
        } for e in entries])
    finally:
        db.close()

@mood_bp.route('/stats', methods=['GET'])
def mood_stats():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'error': 'Not authenticated'}), 401

    db = get_db()
    try:
        # Overall average
        avg = db.execute(
            "SELECT AVG(score) as avg FROM moods WHERE user_id=?", (uid,)
        ).fetchone()

        # Mood breakdown
        breakdown = db.execute(
            "SELECT mood, COUNT(*) as count FROM moods WHERE user_id=? GROUP BY mood ORDER BY count DESC",
            (uid,)
        ).fetchall()

        # Streak (consecutive days with at least 1 entry)
        streak = 0
        check_day = datetime.now()
        while True:
            day_str = check_day.strftime('%Y-%m-%d')
            entry = db.execute(
                "SELECT id FROM moods WHERE user_id=? AND DATE(created_at)=? LIMIT 1",
                (uid, day_str)
            ).fetchone()
            if entry:
                streak += 1
                check_day -= timedelta(days=1)
            else:
                break

        # Total entries
        total = db.execute(
            "SELECT COUNT(*) as cnt FROM moods WHERE user_id=?", (uid,)
        ).fetchone()

        return jsonify({
            'average_score': round(avg['avg']) if avg['avg'] else 0,
            'streak': streak,
            'total_entries': total['cnt'],
            'breakdown': [{'mood': b['mood'], 'count': b['count']} for b in breakdown]
        })
    finally:
        db.close()
