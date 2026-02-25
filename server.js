const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/matkul', require('./routes/matkul'));
app.use('/api/absensi', require('./routes/absensi'));
app.use('/api/laporan', require('./routes/laporan'));

app.get('/', (req, res) => res.json({ message: 'AbsensiKu API berjalan!' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
