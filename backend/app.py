from flask import Flask
from flask_cors import CORS
from database import init_db
from routes.auth import auth_bp
from routes.user import user_bp
from routes.mood import mood_bp
from routes.chat import chat_bp
import os

app = Flask(__name__)
app.secret_key = 'calmbot-secret-key-2024'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB

os.makedirs('uploads', exist_ok=True)

CORS(app, supports_credentials=True, origins=['http://localhost:5173'])

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/user')
app.register_blueprint(mood_bp, url_prefix='/api/mood')
app.register_blueprint(chat_bp, url_prefix='/api/chat')

if __name__ == '__main__':
    init_db()
    print("✅ CalmBot backend running on http://localhost:5000")
    app.run(debug=True, port=5000)
