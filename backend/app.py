from flask import Flask, send_from_directory
from flask_cors import CORS
from database import init_db
from routes.auth import auth_bp
from routes.user import user_bp
from routes.mood import mood_bp
from routes.chat import chat_bp
import os

app = Flask(__name__, static_folder='dist')
app.secret_key = os.getenv('SECRET_KEY', 'fallback-key')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB

os.makedirs('uploads', exist_ok=True)

CORS(app, supports_credentials=True, origins=['http://localhost:5173', 'https://your-deployed-frontend-url.com'])

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/user')
app.register_blueprint(mood_bp, url_prefix='/api/mood')
app.register_blueprint(chat_bp, url_prefix='/api/chat')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    init_db()
    print("✅ CalmBot backend running on http://localhost:5000")
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
