import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/discipleship.db' 
  : path.resolve(process.cwd(), 'discipleship.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'discipler', 'disciple')) NOT NULL DEFAULT 'disciple',
    discipler_name TEXT,
    discipler_phone TEXT,
    discipler_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    module_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_option INTEGER NOT NULL,
    FOREIGN KEY (module_id) REFERENCES modules(id)
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    user_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    score REAL NOT NULL,
    passed BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, module_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (module_id) REFERENCES modules(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    scheduled_for DATETIME,
    sent_at DATETIME,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verse TEXT NOT NULL,
    reference TEXT NOT NULL,
    date DATE UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    email TEXT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  db.prepare(`
    INSERT INTO users (name, email, phone, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('Principal Discipler', 'admin@victoryassembly.org', '1234567890', 'admin123', 'admin');

  const insertCourse = db.prepare('INSERT INTO courses (level, title, description) VALUES (?, ?, ?)');
  insertCourse.run(1, 'Foundation Studies', 'Level 1 - Foundation Studies');
  insertCourse.run(2, 'Intermediate Studies', 'Level 2 - Intermediate Studies');
  insertCourse.run(3, 'Advanced Studies', 'Level 3 - Advanced Studies');

  const insertModule = db.prepare('INSERT INTO modules (course_id, module_number, title, content) VALUES (?, ?, ?, ?)');
  const module1Content = `Introduction...`; // Shortened for brevity
  const moduleInfo = insertModule.run(1, 1, 'Victorious Christian Life – Foundation', module1Content);
  
  const insertQuiz = db.prepare('INSERT INTO quizzes (module_id, question, options, correct_option) VALUES (?, ?, ?, ?)');
  insertQuiz.run(moduleInfo.lastInsertRowid, 'According to Scripture, what best describes the foundation of the Victorious Christian Life?', JSON.stringify([
    'A life free from challenges',
    'A life built on religious activities',
    'A life flowing from union with Christ and obedience to His Word',
    'A life focused on personal discipline'
  ]), 2);
}

export default db;
