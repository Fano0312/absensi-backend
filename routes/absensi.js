// File: routes/absensi.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/selfie/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ── POST /api/absensi/checkin ─────────────────────────────────────────────────
router.post('/checkin', auth, upload.single('foto'), async (req, res) => {
  const { matkul_id, latitude, longitude, tipe } = req.body;
  const foto = req.file ? req.file.filename : null;
  const userId = req.user.id;
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

  try {
    if (tipe === 'masuk') {
      // Cek sudah absen masuk hari ini
      const existing = await pool.query(
        'SELECT * FROM absensi WHERE user_id=$1 AND matkul_id=$2 AND date=$3 AND tipe=$4',
        [userId, matkul_id, date, 'masuk']
      );
      if (existing.rows.length > 0)
        return res.json({ message: 'Sudah absen masuk hari ini!' });

      // Simpan absen masuk — status 'proses' dulu, belum 'hadir'
      await pool.query(
        'INSERT INTO absensi (user_id, matkul_id, date, time, latitude, longitude, foto, status, tipe) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [userId, matkul_id, date, time, latitude, longitude, foto, 'proses', 'masuk']
      );
      return res.json({ message: 'Absensi berhasil!' });
    }

    if (tipe === 'pulang') {
      // Cek sudah absen masuk belum
      const masuk = await pool.query(
        'SELECT * FROM absensi WHERE user_id=$1 AND matkul_id=$2 AND date=$3 AND tipe=$4',
        [userId, matkul_id, date, 'masuk']
      );
      if (masuk.rows.length === 0)
        return res.json({ message: 'Belum absen masuk!' });

      // Cek sudah absen pulang belum
      const existing = await pool.query(
        'SELECT * FROM absensi WHERE user_id=$1 AND matkul_id=$2 AND date=$3 AND tipe=$4',
        [userId, matkul_id, date, 'pulang']
      );
      if (existing.rows.length > 0)
        return res.json({ message: 'Sudah absen pulang hari ini!' });

      // Simpan absen pulang
      await pool.query(
        'INSERT INTO absensi (user_id, matkul_id, date, time, latitude, longitude, foto, status, tipe) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [userId, matkul_id, date, time, latitude, longitude, foto, 'pulang_proses', 'pulang']
      );

      // ✅ Update status absen masuk menjadi 'hadir' setelah pulang
      await pool.query(
        'UPDATE absensi SET status=$1, pulang_time=$2 WHERE user_id=$3 AND matkul_id=$4 AND date=$5 AND tipe=$6',
        ['hadir', time, userId, matkul_id, date, 'masuk']
      );

      return res.json({ message: 'Absensi berhasil!' });
    }

    res.status(400).json({ message: 'Tipe tidak valid!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/absensi/riwayat ─────────────────────────────────────────────────
router.get('/riwayat', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.date, a.time, a.status, a.tipe, a.pulang_time,
              m.name as matkul_name, m.id as matkul_id
       FROM absensi a
       JOIN mata_kuliah m ON a.matkul_id = m.id
       WHERE a.user_id=$1 AND a.tipe='masuk'
       ORDER BY a.date DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/absensi/semua — Admin ───────────────────────────────────────────
router.get('/semua', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.date, a.time, a.status, a.tipe, a.pulang_time,
              a.latitude, a.longitude,
              u.name as mahasiswa_name, u.nim,
              m.name as matkul_name
       FROM absensi a
       JOIN users u ON a.user_id = u.id
       JOIN mata_kuliah m ON a.matkul_id = m.id
       WHERE a.tipe='masuk'
       ORDER BY a.date DESC, a.time DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/absensi/:id — Admin hapus data ───────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const info = await pool.query('SELECT * FROM absensi WHERE id=$1', [req.params.id]);
    if (info.rows.length === 0)
      return res.status(404).json({ message: 'Data tidak ditemukan!' });

    const { user_id, matkul_id, date } = info.rows[0];
    await pool.query(
      'DELETE FROM absensi WHERE user_id=$1 AND matkul_id=$2 AND date=$3',
      [user_id, matkul_id, date]
    );
    res.json({ message: 'Data absensi berhasil dihapus!', success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
