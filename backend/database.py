import sqlite3
import psycopg2
import os
from urllib.parse import urlparse

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///calmbot.db')
IS_POSTGRES = DATABASE_URL.startswith('postgresql')

class DBCursor:
    """Wrapper to abstract SQLite and PostgreSQL differences"""
    def __init__(self, cursor, db_type):
        self.cursor = cursor
        self.db_type = db_type
        self.description = cursor.description
    
    def execute(self, query, params=()):
        if self.db_type == 'postgres':
            query = query.replace('?', '%s')
        self.cursor.execute(query, params)
        return self
    
    def executescript(self, script):
        if self.db_type == 'sqlite':
            self.cursor.executescript(script)
        else:
            for statement in script.split(';'):
                if statement.strip():
                    self.cursor.execute(statement)
    
    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        if self.db_type == 'postgres':
            col_names = [desc[0] for desc in self.cursor.description]
            return {col_names[i]: row[i] for i in range(len(col_names))}
        return row
    
    def fetchall(self):
        rows = self.cursor.fetchall()
        if self.db_type == 'postgres':
            col_names = [desc[0] for desc in self.cursor.description]
            return [{col_names[i]: row[i] for i in range(len(col_names))} for row in rows]
        return rows

class DBConnection:
    """Wrapper to abstract SQLite and PostgreSQL connections"""
    def __init__(self, conn, db_type):
        self.conn = conn
        self.db_type = db_type
    
    def cursor(self):
        return DBCursor(self.conn.cursor(), self.db_type)
    
    def execute(self, query, params=()):
        cursor = self.cursor()
        cursor.execute(query, params)
        return cursor
    
    def commit(self):
        self.conn.commit()
    
    def close(self):
        self.conn.close()

def get_db():
    if IS_POSTGRES:
        parsed = urlparse(DATABASE_URL)
        conn = psycopg2.connect(
            dbname=parsed.path[1:],
            user=parsed.username,
            password=parsed.password,
            host=parsed.hostname,
            port=parsed.port or 5432
        )
        return DBConnection(conn, 'postgres')
    else:
        db_path = DATABASE_URL.replace('sqlite:///', '')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return DBConnection(conn, 'sqlite')

def init_db():
    conn = get_db()
    c = conn.cursor()

    if IS_POSTGRES:
        sql_commands = [
            '''CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                bio TEXT DEFAULT '',
                age INTEGER DEFAULT NULL,
                avatar TEXT DEFAULT NULL,
                topic TEXT DEFAULT NULL,
                theme TEXT DEFAULT 'dark',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )''',
            '''CREATE TABLE IF NOT EXISTS moods (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                mood TEXT NOT NULL,
                note TEXT DEFAULT '',
                score INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )''',
            '''CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )'''
        ]
        for cmd in sql_commands:
            try:
                c.execute(cmd)
            except psycopg2.Error:
                pass
    else:
        c.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                bio TEXT DEFAULT '',
                age INTEGER DEFAULT NULL,
                avatar TEXT DEFAULT NULL,
                topic TEXT DEFAULT NULL,
                theme TEXT DEFAULT 'dark',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS moods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                mood TEXT NOT NULL,
                note TEXT DEFAULT '',
                score INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        ''')

    conn.commit()
    conn.close()
    print("✅ Database initialized")
