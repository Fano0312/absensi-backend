require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const mahasiswa = [
  { nim: '24021014', name: 'Tito Tarang', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021012', name: 'Eka Jimy', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021011', name: 'Vian Jedaut', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021006', name: 'Fatima Nadia', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021001', name: 'Saif Saifullah', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021002', name: 'Cristo Renggo', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021003', name: 'Aldi Moa', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021004', name: 'Ecak Muhtry', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021008', name: 'Dandi Jelaha', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021010', name: 'Febri Dima', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021009', name: 'Fano Jas', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021015', name: 'Fenan Jehaut', prodi: 'Teknik Informatika', semester: 1 },
  { nim: '24021013', name: 'France Nono', prodi: 'Teknik Informatika', semester: 1 },
];

async function tambahMahasiswa() {
  for (const mhs of mahasiswa) {
    try {
      const hash = await bcrypt.hash(mhs.nim, 10); // password = NIM
      await pool.query(
        'INSERT INTO users (nim, name, password, role, prodi, semester) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (nim) DO NOTHING',
        [mhs.nim, mhs.name, hash, 'mahasiswa', mhs.prodi, mhs.semester]
      );
      console.log(`✅ ${mhs.name} (${mhs.nim}) - berhasil ditambahkan`);
    } catch (err) {
      console.error(`❌ ${mhs.name} - Error: ${err.message}`);
    }
  }
  console.log('\n🎉 Semua mahasiswa berhasil ditambahkan!');
  console.log('📌 Password masing-masing = NIM mereka sendiri');
  process.exit();
}

tambahMahasiswa();
