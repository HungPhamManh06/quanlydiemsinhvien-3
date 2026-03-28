import { Router } from 'express';
import pool from './db.js';

const router = Router();

// ============ HELPER ============
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function calculateAverage(attendance, midterm, finalScore) {
  if (attendance === null || midterm === null || finalScore === null) return null;
  return Math.round((attendance * 0.1 + midterm * 0.3 + finalScore * 0.6) * 100) / 100;
}

function getLetterGrade(score) {
  if (score === null) return '-';
  if (score >= 9.0) return 'A+';
  if (score >= 8.5) return 'A';
  if (score >= 8.0) return 'B+';
  if (score >= 7.0) return 'B';
  if (score >= 6.5) return 'C+';
  if (score >= 5.5) return 'C';
  if (score >= 5.0) return 'D+';
  if (score >= 4.0) return 'D';
  return 'F';
}

// Convert DB row to frontend format
function mapStudent(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    name: row.name,
    className: row.class_name,
    email: row.email || '',
    phone: row.phone || '',
    dateOfBirth: row.date_of_birth || '',
    gender: row.gender || 'Nam',
    address: row.address || '',
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
  };
}

function mapSubject(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    credits: row.credits,
    department: row.department || '',
    semester: row.semester || '',
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
  };
}

function mapGrade(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    subjectId: row.subject_id,
    attendanceScore: row.attendance_score,
    midtermScore: row.midterm_score,
    finalScore: row.final_score,
    averageScore: row.average_score,
    letterGrade: row.letter_grade || '-',
    semester: row.semester || '',
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
  };
}

// ============ STUDENTS ============
router.get('/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY created_at ASC');
    res.json(result.rows.map(mapStudent));
  } catch (err) {
    console.error('GET /students error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/students', async (req, res) => {
  try {
    const { studentId, name, className, email, phone, dateOfBirth, gender, address } = req.body;
    const id = generateId();
    const result = await pool.query(
      `INSERT INTO students (id, student_id, name, class_name, email, phone, date_of_birth, gender, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, studentId, name, className, email || '', phone || '', dateOfBirth || '', gender || 'Nam', address || '']
    );
    res.status(201).json(mapStudent(result.rows[0]));
  } catch (err) {
    console.error('POST /students error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/students/:id', async (req, res) => {
  try {
    const { studentId, name, className, email, phone, dateOfBirth, gender, address } = req.body;
    const result = await pool.query(
      `UPDATE students SET student_id=$1, name=$2, class_name=$3, email=$4, phone=$5, 
       date_of_birth=$6, gender=$7, address=$8 WHERE id=$9 RETURNING *`,
      [studentId, name, className, email || '', phone || '', dateOfBirth || '', gender || 'Nam', address || '', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(mapStudent(result.rows[0]));
  } catch (err) {
    console.error('PUT /students error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    // Grades will be cascade deleted due to ON DELETE CASCADE
    const result = await pool.query('DELETE FROM students WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /students error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============ SUBJECTS ============
router.get('/subjects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subjects ORDER BY created_at ASC');
    res.json(result.rows.map(mapSubject));
  } catch (err) {
    console.error('GET /subjects error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/subjects', async (req, res) => {
  try {
    const { subjectId, name, credits, department, semester } = req.body;
    const id = generateId();
    const result = await pool.query(
      `INSERT INTO subjects (id, subject_id, name, credits, department, semester)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, subjectId, name, credits || 3, department || '', semester || '']
    );
    res.status(201).json(mapSubject(result.rows[0]));
  } catch (err) {
    console.error('POST /subjects error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/subjects/:id', async (req, res) => {
  try {
    const { subjectId, name, credits, department, semester } = req.body;
    const result = await pool.query(
      `UPDATE subjects SET subject_id=$1, name=$2, credits=$3, department=$4, semester=$5 
       WHERE id=$6 RETURNING *`,
      [subjectId, name, credits || 3, department || '', semester || '', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(mapSubject(result.rows[0]));
  } catch (err) {
    console.error('PUT /subjects error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/subjects/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM subjects WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /subjects error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============ GRADES ============
router.get('/grades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grades ORDER BY created_at ASC');
    res.json(result.rows.map(mapGrade));
  } catch (err) {
    console.error('GET /grades error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/grades', async (req, res) => {
  try {
    const { studentId, subjectId, attendanceScore, midtermScore, finalScore, semester } = req.body;
    const id = generateId();
    const avg = calculateAverage(attendanceScore, midtermScore, finalScore);
    const letter = getLetterGrade(avg);
    const result = await pool.query(
      `INSERT INTO grades (id, student_id, subject_id, attendance_score, midterm_score, final_score, average_score, letter_grade, semester)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, studentId, subjectId, attendanceScore, midtermScore, finalScore, avg, letter, semester || '']
    );
    res.status(201).json(mapGrade(result.rows[0]));
  } catch (err) {
    console.error('POST /grades error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/grades/:id', async (req, res) => {
  try {
    const { studentId, subjectId, attendanceScore, midtermScore, finalScore, semester } = req.body;
    const avg = calculateAverage(attendanceScore, midtermScore, finalScore);
    const letter = getLetterGrade(avg);
    const result = await pool.query(
      `UPDATE grades SET student_id=$1, subject_id=$2, attendance_score=$3, midterm_score=$4, 
       final_score=$5, average_score=$6, letter_grade=$7, semester=$8 
       WHERE id=$9 RETURNING *`,
      [studentId, subjectId, attendanceScore, midtermScore, finalScore, avg, letter, semester || '', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(mapGrade(result.rows[0]));
  } catch (err) {
    console.error('PUT /grades error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/grades/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM grades WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /grades error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============ RESET / SEED DATA ============
router.post('/seed', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clear all data
    await client.query('DELETE FROM grades');
    await client.query('DELETE FROM subjects');
    await client.query('DELETE FROM students');

    // Sample students
    const studentsData = [
      ['SV001', 'Nguyễn Văn An', 'CNTT-K20A', 'an.nv@university.edu.vn', '0901234567', '2002-03-15', 'Nam', 'Hà Nội'],
      ['SV002', 'Trần Thị Bình', 'CNTT-K20A', 'binh.tt@university.edu.vn', '0912345678', '2002-07-22', 'Nữ', 'Hải Phòng'],
      ['SV003', 'Lê Hoàng Cường', 'CNTT-K20B', 'cuong.lh@university.edu.vn', '0923456789', '2002-01-10', 'Nam', 'Đà Nẵng'],
      ['SV004', 'Phạm Thị Dung', 'CNTT-K20B', 'dung.pt@university.edu.vn', '0934567890', '2002-11-05', 'Nữ', 'TP. Hồ Chí Minh'],
      ['SV005', 'Hoàng Minh Đức', 'CNTT-K20A', 'duc.hm@university.edu.vn', '0945678901', '2002-05-20', 'Nam', 'Huế'],
      ['SV006', 'Ngô Thị Hà', 'QTKD-K20A', 'ha.nt@university.edu.vn', '0956789012', '2002-09-12', 'Nữ', 'Hà Nội'],
      ['SV007', 'Vũ Đình Giang', 'QTKD-K20A', 'giang.vd@university.edu.vn', '0967890123', '2002-02-28', 'Nam', 'Nam Định'],
      ['SV008', 'Đặng Thùy Linh', 'KT-K20A', 'linh.dt@university.edu.vn', '0978901234', '2002-06-18', 'Nữ', 'Thanh Hóa'],
    ];

    const studentIds = [];
    for (const s of studentsData) {
      const id = generateId();
      studentIds.push(id);
      await client.query(
        `INSERT INTO students (id, student_id, name, class_name, email, phone, date_of_birth, gender, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, ...s]
      );
    }

    // Sample subjects
    const subjectsData = [
      ['MH001', 'Lập trình C++', 3, 'Công nghệ thông tin', 'HK1-2024'],
      ['MH002', 'Cơ sở dữ liệu', 4, 'Công nghệ thông tin', 'HK1-2024'],
      ['MH003', 'Toán cao cấp', 3, 'Khoa học cơ bản', 'HK1-2024'],
      ['MH004', 'Tiếng Anh chuyên ngành', 2, 'Ngoại ngữ', 'HK1-2024'],
      ['MH005', 'Mạng máy tính', 3, 'Công nghệ thông tin', 'HK2-2024'],
      ['MH006', 'Lập trình Web', 4, 'Công nghệ thông tin', 'HK2-2024'],
      ['MH007', 'Kinh tế vi mô', 3, 'Kinh tế', 'HK1-2024'],
      ['MH008', 'Quản trị học', 3, 'Quản trị kinh doanh', 'HK1-2024'],
    ];

    const subjectIds = [];
    for (const s of subjectsData) {
      const id = generateId();
      subjectIds.push(id);
      await client.query(
        `INSERT INTO subjects (id, subject_id, name, credits, department, semester)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, ...s]
      );
    }

    // Sample grades [studentIdx, subjectIdx, attendance, midterm, final, semester]
    const gradesData = [
      [0, 0, 9, 8.5, 7.5, 'HK1-2024'], [0, 1, 8, 7, 8, 'HK1-2024'],
      [0, 2, 7, 6.5, 7, 'HK1-2024'], [0, 3, 9, 8, 8.5, 'HK1-2024'],
      [0, 4, 8, 7.5, 9, 'HK2-2024'], [0, 5, 9, 8, 8, 'HK2-2024'],
      [1, 0, 10, 9, 9.5, 'HK1-2024'], [1, 1, 9, 8.5, 9, 'HK1-2024'],
      [1, 2, 8, 7.5, 8.5, 'HK1-2024'], [1, 4, 9, 9, 8.5, 'HK2-2024'],
      [2, 0, 7, 6, 5.5, 'HK1-2024'], [2, 1, 6, 5.5, 6, 'HK1-2024'],
      [2, 2, 8, 7, 6.5, 'HK1-2024'], [2, 5, 7, 6.5, 7, 'HK2-2024'],
      [3, 0, 9, 8, 8.5, 'HK1-2024'], [3, 1, 8, 9, 8, 'HK1-2024'],
      [3, 3, 10, 9, 9, 'HK1-2024'],
      [4, 0, 5, 4, 3.5, 'HK1-2024'], [4, 1, 6, 5, 4, 'HK1-2024'],
      [4, 2, 7, 6, 5, 'HK1-2024'],
      [5, 6, 9, 8.5, 8, 'HK1-2024'], [5, 7, 8, 7.5, 9, 'HK1-2024'],
      [6, 6, 7, 6.5, 7, 'HK1-2024'], [6, 7, 8, 7, 7.5, 'HK1-2024'],
      [7, 2, 9, 8.5, 9, 'HK1-2024'], [7, 6, 10, 9, 9.5, 'HK1-2024'],
    ];

    for (const g of gradesData) {
      const id = generateId();
      const avg = calculateAverage(g[2], g[3], g[4]);
      const letter = getLetterGrade(avg);
      await client.query(
        `INSERT INTO grades (id, student_id, subject_id, attendance_score, midterm_score, final_score, average_score, letter_grade, semester)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, studentIds[g[0]], subjectIds[g[1]], g[2], g[3], g[4], avg, letter, g[5]]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Sample data seeded successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /seed error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
