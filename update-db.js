require('dotenv').config();
const pool = require('./db');

async function updateDB() {
  try {
    // Tambah kolom tipe (masuk/pulang)
    await pool.query(`ALTER TABLE absensi ADD COLUMN IF NOT EXISTS tipe VARCHAR(10) DEFAULT 'masuk'`);
    console.log('✅ Kolom tipe berhasil ditambahkan');

    // Tambah kolom pulang
    await pool.query(`ALTER TABLE absensi ADD COLUMN IF NOT EXISTS pulang_time VARCHAR(5)`);
    await pool.query(`ALTER TABLE absensi ADD COLUMN IF NOT EXISTS pulang_latitude DECIMAL(10,8)`);
    await pool.query(`ALTER TABLE absensi ADD COLUMN IF NOT EXISTS pulang_longitude DECIMAL(11,8)`);
    await pool.query(`ALTER TABLE absensi ADD COLUMN IF NOT EXISTS pulang_foto VARCHAR(255)`);
    console.log('✅ Kolom pulang berhasil ditambahkan');

    // Update data lama agar tipe = masuk
    await pool.query(`UPDATE absensi SET tipe='masuk' WHERE tipe IS NULL`);
    console.log('✅ Data lama diupdate');

    console.log('\n🎉 Database berhasil diupdate! Fitur absen masuk & pulang siap digunakan.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  process.exit();
}

updateDB();
