const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Register
router.post('/register', async (req, res) => {
  const { nim, name, password, role, prodi, semester } = req.body;
  try {
    const exists = await pool.query('SELECT * FROM users WHERE nim = $1', [nim]);
    if (exists.rows.length > 0) return res.status(400).json({ message: 'NIM sudah terdaftar' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (nim, name, password, role, prodi, semester) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nim, name, role, prodi, semester',
      [nim, name, hash, role || 'mahasiswa', prodi, semester || 1]
    );
    res.json({ message: 'Registrasi berhasil', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { nim, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE nim = $1', [nim]);
    if (result.rows.length === 0) return res.status(400).json({ message: 'NIM tidak ditemukan' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Password salah' });

    const token = jwt.sign(
      { id: user.id, nim: user.nim, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, nim: user.nim, name: user.name, role: user.role, prodi: user.prodi, semester: user.semester } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get profile
router.get('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nim, name, role, prodi, semester FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
