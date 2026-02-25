const pool = require('./db');
const fs = require('fs');

async function setup() {
  try {
    const sql = fs.readFileSync('./database.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Tabel berhasil dibuat!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  process.exit();
}

setup();