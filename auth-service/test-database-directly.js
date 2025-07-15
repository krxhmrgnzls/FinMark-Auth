// test-database-directly.js
// This script tests the database directly without going through the API

const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

// Point to your database file
const dbPath = path.join(__dirname, 'finmark.db');
console.log('📁 Database path:', dbPath);

try {
  // Open database
  const db = new Database(dbPath, { verbose: console.log });
  
  console.log('\n📊 Testing Database Connection...\n');
  
  // 1. Check if tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables in database:', tables.map(t => t.name));
  
  // 2. Check current users
  const users = db.prepare('SELECT id, email, full_name, created_at FROM users').all();
  console.log('\n👥 Current users:', users.length);
  users.forEach(user => {
    console.log(`  - ${user.email} (${user.full_name}) - Created: ${user.created_at}`);
  });
  
  // 3. Insert a test user directly
  console.log('\n🧪 Inserting test user directly...');
  const testEmail = `direct-test-${Date.now()}@example.com`;
  const hashedPassword = bcrypt.hashSync('TestPassword123', 10);
  
  try {
    const insert = db.prepare('INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)');
    const result = insert.run(testEmail, hashedPassword, 'Direct Test User');
    console.log('✅ User inserted successfully! ID:', result.lastInsertRowid);
    
    // Verify insertion
    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    console.log('📝 New user details:', {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      created_at: newUser.created_at
    });
  } catch (error) {
    console.error('❌ Error inserting user:', error.message);
  }
  
  // 4. Check total users again
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log('\n📊 Total users in database:', totalUsers.count);
  
  // Close database
  db.close();
  console.log('\n✅ Database test completed!');
  
} catch (error) {
  console.error('❌ Database error:', error);
}

// To run this script:
// 1. Save it in your auth-service directory
// 2. Run: node test-database-directly.js