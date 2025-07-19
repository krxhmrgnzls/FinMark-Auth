const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log(' Verifying Database Setup...\n');

// Check database file location
const dbPath = path.join(__dirname, 'finmark.db');
const absolutePath = path.resolve(dbPath);

console.log(' Database path:', absolutePath);
console.log(' File exists:', fs.existsSync(absolutePath));

if (fs.existsSync(absolutePath)) {
  const stats = fs.statSync(absolutePath);
  console.log(' File size:', stats.size, 'bytes');
  
  try {
    // Open database
    const db = new Database(absolutePath);
    
    // Check tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('\n Tables found:', tables.map(t => t.name).join(', '));
    
    // Check users table structure
    const columns = db.prepare("PRAGMA table_info(users)").all();
    console.log('\n Users table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    // Count users
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log('\n Total users:', userCount.count);
    
    // List all users
    if (userCount.count > 0) {
      const users = db.prepare('SELECT id, email, full_name, created_at FROM users').all();
      console.log('\n Existing users:');
      users.forEach(user => {
        console.log(`  - [${user.id}] ${user.email} (${user.full_name})`);
      });
    }
    
    db.close();
    console.log('\n Database verification complete!');
    
  } catch (error) {
    console.error('\n Database error:', error.message);
  }
} else {
  console.error('\n Database file not found! Run the server first to create it.');
}

// To run this script:
// node verify-db.js