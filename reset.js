require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function reset() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query('UPDATE users SET password = $1 WHERE nim = $2', [hash, 'admin']);
    console.log('Password berhasil direset menjadi: admin123');
  } catch (err) {
    console.error('Gagal reset password:', err.message);
  } finally {
    process.exit();
  }
}

reset();