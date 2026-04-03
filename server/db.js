import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Kiểm tra DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('');
  console.error('╔════════════════════════════════════════════════════════╗');
  console.error('║  ❌ LỖI: Chưa cấu hình DATABASE_URL                  ║');
  console.error('║                                                        ║');
  console.error('║  Bạn cần:                                              ║');
  console.error('║  1. Tạo PostgreSQL database trên Render                ║');
  console.error('║  2. Copy Internal Database URL                         ║');
  console.error('║  3. Thêm biến DATABASE_URL vào Environment Variables   ║');
  console.error('╚════════════════════════════════════════════════════════╝');
  console.error('');
  process.exit(1);
}

const isInternalIP = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@10.');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Tắt SSL cho mạng nội bộ Render (IP 10.x.x.x) vì mạng nội bộ không hỗ trợ/yêu cầu SSL
  ssl: (process.env.NODE_ENV === 'production' && !isInternalIP) ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});

// Test kết nối
pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
});

// Tạo bảng nếu chưa tồn tại
export async function initDatabase(retries = 7) {
  let client;
  while (retries > 0) {
    try {
      client = await pool.connect();
      console.log('✅ Kết nối database thành công!');
      break; // Kết nối thành công, thoát khỏi vòng lặp
    } catch (err) {
      console.error(`❌ Lỗi kết nối database: ${err.message}`);
      retries -= 1;
      if (retries === 0) {
        console.error('❌ Đã hết số lần thử kết nối database.');
        throw err;
      }
      console.log(`⏳ Đang thử lại trong 5 giây... (Còn ${retries} lần thử)`);
      // Đợi 5 giây trước khi thử lại
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        student_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        class_name TEXT NOT NULL,
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        date_of_birth TEXT DEFAULT '',
        gender TEXT DEFAULT 'Nam',
        address TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        subject_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        credits INTEGER NOT NULL DEFAULT 3,
        department TEXT DEFAULT '',
        semester TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS grades (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        attendance_score REAL,
        midterm_score REAL,
        final_score REAL,
        average_score REAL,
        letter_grade TEXT DEFAULT '-',
        semester TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(student_id, subject_id, semester)
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        role TEXT DEFAULT 'teacher',
        department TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Check if database has sample data
export async function hasSampleData() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM students');
    return parseInt(result.rows[0].count) > 0;
  } catch (err) {
    console.error('❌ Error checking sample data:', err.message);
    return false;
  }
}

export default pool;
