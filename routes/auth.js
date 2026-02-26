// File: routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { nim, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE nim=$1', [nim]);
    if (result.rows.length === 0)
      return res.json({ message: 'NIM tidak ditemukan!' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ message: 'Password salah!' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userSafe } = user;
    res.json({ token, user: userSafe });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/auth/me — Ambil data terbaru dari database ──────────────────────
// Frontend memanggil ini setiap kali app dibuka supaya data user selalu update
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nim, name, role, prodi, semester FROM users WHERE id=$1',
      [req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User tidak ditemukan!' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
