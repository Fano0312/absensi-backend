const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Get semua matkul
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT mk.*, u.name as dosen_name 
      FROM mata_kuliah mk 
      LEFT JOIN users u ON mk.dosen_id = u.id
      ORDER BY mk.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tambah matkul (admin only)
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak' });
  const { name, code, day, time, room, dosen_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO mata_kuliah (name, code, day, time, room, dosen_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, code, day, time, room, dosen_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hapus matkul (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak' });
  try {
    await pool.query('DELETE FROM mata_kuliah WHERE id = $1', [req.params.id]);
    res.json({ message: 'Mata kuliah dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
