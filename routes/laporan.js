const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Laporan per mahasiswa
router.get('/mahasiswa/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        mk.name as matkul_name,
        mk.code,
        COUNT(*) as total,
        COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) as hadir,
        COUNT(CASE WHEN a.status = 'izin' THEN 1 END) as izin,
        COUNT(CASE WHEN a.status = 'sakit' THEN 1 END) as sakit,
        COUNT(CASE WHEN a.status = 'alpha' THEN 1 END) as alpha,
        ROUND(COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) * 100.0 / COUNT(*), 1) as persentase
      FROM absensi a
      JOIN mata_kuliah mk ON a.matkul_id = mk.id
      WHERE a.user_id = $1
      GROUP BY mk.id, mk.name, mk.code
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Laporan semua mahasiswa (admin)
router.get('/semua', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak' });
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.nim, u.name, u.prodi,
        COUNT(*) as total_absensi,
        COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) as total_hadir,
        ROUND(COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as persentase
      FROM users u
      LEFT JOIN absensi a ON u.id = a.user_id
      WHERE u.role = 'mahasiswa'
      GROUP BY u.id, u.nim, u.name, u.prodi
      ORDER BY persentase DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Laporan per matkul (admin)
router.get('/matkul/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak' });
  try {
    const result = await pool.query(`
      SELECT 
        u.nim, u.name,
        COUNT(*) as total,
        COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) as hadir,
        COUNT(CASE WHEN a.status = 'alpha' THEN 1 END) as alpha,
        ROUND(COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as persentase
      FROM absensi a
      JOIN users u ON a.user_id = u.id
      WHERE a.matkul_id = $1
      GROUP BY u.id, u.nim, u.name
      ORDER BY persentase DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
