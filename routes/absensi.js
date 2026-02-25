const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup upload foto
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/selfie';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${req.user.id}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Check-in absensi dengan foto selfie
router.post('/checkin', authMiddleware, upload.single('foto'), async (req, res) => {
  const { matkul_id, latitude, longitude } = req.body;
  const foto_path = req.file ? req.file.path : null;
  const today = new Date().toISOString().split('T')[0];
  const time_now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  try {
    // Cek sudah absen hari ini belum
    const existing = await pool.query(
      'SELECT * FROM absensi WHERE user_id = $1 AND matkul_id = $2 AND date = $3',
      [req.user.id, matkul_id, today]
    );
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Sudah absen hari ini' });

    const result = await pool.query(
      `INSERT INTO absensi (user_id, matkul_id, date, time, status, foto, latitude, longitude)
       VALUES ($1, $2, $3, $4, 'hadir', $5, $6, $7) RETURNING *`,
      [req.user.id, matkul_id, today, time_now, foto_path, latitude, longitude]
    );
    res.json({ message: 'Absensi berhasil!', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get riwayat absensi mahasiswa
router.get('/riwayat', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, mk.name as matkul_name, mk.code as matkul_code
      FROM absensi a
      JOIN mata_kuliah mk ON a.matkul_id = mk.id
      WHERE a.user_id = $1
      ORDER BY a.date DESC, a.time DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get semua absensi (admin)
router.get('/semua', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak' });
  try {
    const result = await pool.query(`
      SELECT a.*, u.name as mahasiswa_name, u.nim, mk.name as matkul_name, mk.code
      FROM absensi a
      JOIN users u ON a.user_id = u.id
      JOIN mata_kuliah mk ON a.matkul_id = mk.id
      ORDER BY a.date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Input izin/sakit
router.post('/izin', authMiddleware, async (req, res) => {
  const { matkul_id, status, keterangan } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    const existing = await pool.query(
      'SELECT * FROM absensi WHERE user_id = $1 AND matkul_id = $2 AND date = $3',
      [req.user.id, matkul_id, today]
    );
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Sudah ada data absensi hari ini' });

    const result = await pool.query(
      `INSERT INTO absensi (user_id, matkul_id, date, time, status, keterangan)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, matkul_id, today, '-', status, keterangan]
    );
    res.json({ message: 'Berhasil input ' + status, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
