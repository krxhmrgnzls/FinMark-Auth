// find-all-data.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔍 Looking for all finmark.db files and their data...\n');

// Possible locations
const possiblePaths = [
  path.join(__dirname, 'finmark.db'),
  path.join(__dirname, '..', 'finmark.db'),
  path.join(__dirname, '..', '..', 'finmark.db'),
  'C:\\Users\\user\\finmark-auth\\finmark.db',
  'C:\\Users\\user\\finmark-auth\\auth-service\\finmark.db'
];

possiblePaths.forEach(dbPath => {
  const absolutePath = path.resolve(dbPath);
  
  if (fs.existsSync(absolutePath)) {
    console.log(`\n📁 Found database at: ${absolutePath}`);
    
    try {
      const db = new Database(absolutePath, { readonly: true });
      const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
      const allUsers = db.prepare('SELECT id, email, full_name FROM users').all();
      
      console.log(`   Users count: ${users.count}`);
      if (allUsers.length > 0) {
        console.log('   Users:');
        allUsers.forEach(user => {
          console.log(`     - ${user.email} (${user.full_name})`);
        });
      }
      
      db.close();
    } catch (error) {
      console.log(`   Error reading: ${error.message}`);
    }
  }
});

console.log('\n✅ Search complete!');