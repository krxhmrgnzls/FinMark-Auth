const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../finmark.db');
const absolutePath = path.resolve(dbPath);

console.log('📁 Database will be created at:', absolutePath);

const dbDir = path.dirname(absolutePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(absolutePath, { 
  verbose: console.log,  
  fileMustExist: false   
});

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Users table created/verified');
} catch (error) {
  console.error('Error creating users table:', error);
}

// Create sessions table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
  console.log('Sessions table created/verified');
} catch (error) {
  console.error('Error creating sessions table:', error);
}

// Verify the database file was created
if (fs.existsSync(absolutePath)) {
  const stats = fs.statSync(absolutePath);
  console.log('Database file created successfully');
  console.log(`File size: ${stats.size} bytes`);
} else {
  console.error('Database file was not created!');
}

module.exports = db;