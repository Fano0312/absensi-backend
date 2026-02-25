-- ========================================
-- DATABASE AbsensiKu
-- Jalankan file ini di PostgreSQL
-- ========================================

-- Tabel Users (Mahasiswa & Admin/Dosen)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nim VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'mahasiswa' CHECK (role IN ('mahasiswa', 'admin')),
  prodi VARCHAR(100),
  semester INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Mata Kuliah
CREATE TABLE IF NOT EXISTS mata_kuliah (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  day VARCHAR(20),
  time VARCHAR(30),
  room VARCHAR(50),
  dosen_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Absensi
CREATE TABLE IF NOT EXISTS absensi (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  matkul_id INT REFERENCES mata_kuliah(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time VARCHAR(10),
  status VARCHAR(20) DEFAULT 'hadir' CHECK (status IN ('hadir', 'izin', 'sakit', 'alpha')),
  foto VARCHAR(255),
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, matkul_id, date)
);

-- ========================================
-- DATA AWAL (SEED)
-- ========================================

-- Insert admin/dosen
INSERT INTO users (nim, name, password, role, prodi) VALUES
('admin', 'Dr. Hendra Wijaya', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Dosen')
ON CONFLICT (nim) DO NOTHING;

-- Insert mahasiswa contoh
-- Password default: 123456
INSERT INTO users (nim, name, password, role, prodi, semester) VALUES
('2021001', 'Budi Santoso', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mahasiswa', 'Teknik Informatika', 5),
('2021002', 'Siti Rahayu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mahasiswa', 'Teknik Informatika', 5),
('2021003', 'Ahmad Fauzi', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mahasiswa', 'Sistem Informasi', 3)
ON CONFLICT (nim) DO NOTHING;

-- Note: Password hash di atas = "password" (dari library bcrypt)
-- Ganti dengan hash yang benar menggunakan: bcrypt.hash('123456', 10)
