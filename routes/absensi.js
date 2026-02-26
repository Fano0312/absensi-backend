const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/selfie/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ── Absen Masuk atau Pulang ──────────────────────────────────────────────────
router.post('/checkin', auth, upload.single('foto'), async (req, res) => {
  try {
    const { matkul_id, latitude, longitude, tipe } = req.body;
    const foto = req.file ? req.file.filename : null;
    const userId = req.user.id;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5);
    const tipeFinal = tipe || 'masuk';

    if (tipeFinal === 'masuk') {
      // Cek apakah sudah absen masuk hari ini
      const existing = await pool.query(
        'SELECT * FROM absensi WHERE user_id=$1 AND matkul_id=$2 AND date=$3 AND tipe=$4',
        [userId, matkul_id, date, 'masuk']
      );
      if (existing.rows.length > 0) {
        return res.json({ message: 'Sudah absen masuk hari ini!' });
      }
      await pool.query(
        'INSERT INTO absensi (user_id, matkul_id, date, time, latitude, longitude, foto, status, tipe) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [userId, matkul_id, date, time, latitude||null, longitude||null, foto, 'hadir', 'masuk']
      );
    } else if (tipeFinal === 'pulang') {
      // Cek apakah sudah absen masuk
      const absenMasuk = await pool.query(
        'SELECT * FROM absensi WHERE user_id=$1 AND matkul_id=$2 AND date=$3 AND tipe=$4',
        [userId, matkul_id, date, 'masuk']
      );
      if (absenMasuk.rows.length === 0) {
        return res.json({ message: 'Harus absen masuk dulu!' });
      }
      // Cek sudah absen pulang belum
      const sudahPulang = await pool.query(
        'SELECT * FROM absensi WHERE user_id=$1 AND matkul_id=$2 AND date=$3 AND tipe=$4',
        [userId, matkul_id, date, 'pulang']
      );
      if (sudahPulang.rows.length > 0) {
        return res.json({ message: 'Sudah absen pulang hari ini!' });
      }
      // Update absen masuk dengan waktu pulang
      await pool.query(
        'UPDATE absensi SET pulang_time=$1, pulang_latitude=$2, pulang_longitude=$3, pulang_foto=$4 WHERE user_id=$5 AND matkul_id=$6 AND date=$7 AND tipe=$8',
        [time, latitude||null, longitude||null, foto, userId, matkul_id, date, 'masuk']
      );
      // Juga insert record pulang
      await pool.query(
        'INSERT INTO absensi (user_id, matkul_id, date, time, latitude, longitude, foto, status, tipe) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [userId, matkul_id, date, time, latitude||null, longitude||null, foto, 'hadir', 'pulang']
      );
    }

    res.json({ message: 'Absensi berhasil!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error server: ' + err.message });
  }
});

// ── Riwayat Mahasiswa (gabung masuk + pulang) ────────────────────────────────
router.get('/riwayat', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, a.matkul_id, a.date, a.time, a.status, a.tipe,
        a.latitude, a.longitude, a.foto,
        a.pulang_time, a.pulang_latitude, a.pulang_longitude,
        m.name as matkul_name, m.code
      FROM absensi a
      JOIN mata_kuliah m ON a.matkul_id = m.id
      WHERE a.user_id = $1 AND a.tipe = 'masuk'
      ORDER BY a.date DESC, a.time DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Semua Absensi (Admin) ────────────────────────────────────────────────────
router.get('/semua', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, a.date, a.time, a.status, a.tipe,
        a.latitude, a.longitude,
        a.pulang_time, a.pulang_latitude, a.pulang_longitude,
        u.name as mahasiswa_name, u.nim,
        m.name as matkul_name
      FROM absensi a
      JOIN users u ON a.user_id = u.id
      JOIN mata_kuliah m ON a.matkul_id = m.id
      WHERE a.tipe = 'masuk' OR a.tipe IS NULL
      ORDER BY a.date DESC, a.time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
