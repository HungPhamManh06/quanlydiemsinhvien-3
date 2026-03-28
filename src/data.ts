import { Student, Subject, Grade } from './types';

const STUDENTS_KEY = 'university_students';
const SUBJECTS_KEY = 'university_subjects';
const GRADES_KEY = 'university_grades';

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== STUDENTS =====
export function getStudents(): Student[] {
  const data = localStorage.getItem(STUDENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

export function addStudent(student: Omit<Student, 'id' | 'createdAt'>): Student {
  const students = getStudents();
  const newStudent: Student = {
    ...student,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  students.push(newStudent);
  saveStudents(students);
  return newStudent;
}

export function updateStudent(id: string, data: Partial<Student>): Student | null {
  const students = getStudents();
  const index = students.findIndex(s => s.id === id);
  if (index === -1) return null;
  students[index] = { ...students[index], ...data };
  saveStudents(students);
  return students[index];
}

export function deleteStudent(id: string): boolean {
  const students = getStudents();
  const filtered = students.filter(s => s.id !== id);
  if (filtered.length === students.length) return false;
  saveStudents(filtered);
  // Also delete related grades
  const grades = getGrades().filter(g => g.studentId !== id);
  saveGrades(grades);
  return true;
}

// ===== SUBJECTS =====
export function getSubjects(): Subject[] {
  const data = localStorage.getItem(SUBJECTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveSubjects(subjects: Subject[]): void {
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
}

export function addSubject(subject: Omit<Subject, 'id' | 'createdAt'>): Subject {
  const subjects = getSubjects();
  const newSubject: Subject = {
    ...subject,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  subjects.push(newSubject);
  saveSubjects(subjects);
  return newSubject;
}

export function updateSubject(id: string, data: Partial<Subject>): Subject | null {
  const subjects = getSubjects();
  const index = subjects.findIndex(s => s.id === id);
  if (index === -1) return null;
  subjects[index] = { ...subjects[index], ...data };
  saveSubjects(subjects);
  return subjects[index];
}

export function deleteSubject(id: string): boolean {
  const subjects = getSubjects();
  const filtered = subjects.filter(s => s.id !== id);
  if (filtered.length === subjects.length) return false;
  saveSubjects(filtered);
  // Also delete related grades
  const grades = getGrades().filter(g => g.subjectId !== id);
  saveGrades(grades);
  return true;
}

// ===== GRADES =====
export function getGrades(): Grade[] {
  const data = localStorage.getItem(GRADES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveGrades(grades: Grade[]): void {
  localStorage.setItem(GRADES_KEY, JSON.stringify(grades));
}

export function calculateAverage(attendance: number | null, midterm: number | null, final_score: number | null): number | null {
  if (attendance === null || midterm === null || final_score === null) return null;
  return Math.round((attendance * 0.1 + midterm * 0.3 + final_score * 0.6) * 100) / 100;
}

export function getLetterGrade(score: number | null): string {
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

export function getGradePoint(letterGrade: string): number {
  const map: Record<string, number> = {
    'A+': 4.0, 'A': 3.7, 'B+': 3.5, 'B': 3.0,
    'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0,
  };
  return map[letterGrade] ?? 0;
}

export function addGrade(grade: Omit<Grade, 'id' | 'createdAt' | 'averageScore' | 'letterGrade'>): Grade {
  const grades = getGrades();
  const avg = calculateAverage(grade.attendanceScore, grade.midtermScore, grade.finalScore);
  const newGrade: Grade = {
    ...grade,
    id: generateId(),
    averageScore: avg,
    letterGrade: getLetterGrade(avg),
    createdAt: new Date().toISOString(),
  };
  grades.push(newGrade);
  saveGrades(grades);
  return newGrade;
}

export function updateGrade(id: string, data: Partial<Grade>): Grade | null {
  const grades = getGrades();
  const index = grades.findIndex(g => g.id === id);
  if (index === -1) return null;
  const updated = { ...grades[index], ...data };
  updated.averageScore = calculateAverage(updated.attendanceScore, updated.midtermScore, updated.finalScore);
  updated.letterGrade = getLetterGrade(updated.averageScore);
  grades[index] = updated;
  saveGrades(grades);
  return grades[index];
}

export function deleteGrade(id: string): boolean {
  const grades = getGrades();
  const filtered = grades.filter(g => g.id !== id);
  if (filtered.length === grades.length) return false;
  saveGrades(filtered);
  return true;
}

// ===== SAMPLE DATA =====
export function initSampleData(): void {
  if (getStudents().length > 0) return;

  const students: Omit<Student, 'id' | 'createdAt'>[] = [
    { studentId: 'SV001', name: 'Nguyễn Văn An', className: 'CNTT-K20A', email: 'an.nv@university.edu.vn', phone: '0901234567', dateOfBirth: '2002-03-15', gender: 'Nam', address: 'Hà Nội' },
    { studentId: 'SV002', name: 'Trần Thị Bình', className: 'CNTT-K20A', email: 'binh.tt@university.edu.vn', phone: '0912345678', dateOfBirth: '2002-07-22', gender: 'Nữ', address: 'Hải Phòng' },
    { studentId: 'SV003', name: 'Lê Hoàng Cường', className: 'CNTT-K20B', email: 'cuong.lh@university.edu.vn', phone: '0923456789', dateOfBirth: '2002-01-10', gender: 'Nam', address: 'Đà Nẵng' },
    { studentId: 'SV004', name: 'Phạm Thị Dung', className: 'CNTT-K20B', email: 'dung.pt@university.edu.vn', phone: '0934567890', dateOfBirth: '2002-11-05', gender: 'Nữ', address: 'TP. Hồ Chí Minh' },
    { studentId: 'SV005', name: 'Hoàng Minh Đức', className: 'CNTT-K20A', email: 'duc.hm@university.edu.vn', phone: '0945678901', dateOfBirth: '2002-05-20', gender: 'Nam', address: 'Huế' },
    { studentId: 'SV006', name: 'Ngô Thị Hà', className: 'QTKD-K20A', email: 'ha.nt@university.edu.vn', phone: '0956789012', dateOfBirth: '2002-09-12', gender: 'Nữ', address: 'Hà Nội' },
    { studentId: 'SV007', name: 'Vũ Đình Giang', className: 'QTKD-K20A', email: 'giang.vd@university.edu.vn', phone: '0967890123', dateOfBirth: '2002-02-28', gender: 'Nam', address: 'Nam Định' },
    { studentId: 'SV008', name: 'Đặng Thùy Linh', className: 'KT-K20A', email: 'linh.dt@university.edu.vn', phone: '0978901234', dateOfBirth: '2002-06-18', gender: 'Nữ', address: 'Thanh Hóa' },
  ];

  const subjects: Omit<Subject, 'id' | 'createdAt'>[] = [
    { subjectId: 'MH001', name: 'Lập trình C++', credits: 3, department: 'Công nghệ thông tin', semester: 'HK1-2024' },
    { subjectId: 'MH002', name: 'Cơ sở dữ liệu', credits: 4, department: 'Công nghệ thông tin', semester: 'HK1-2024' },
    { subjectId: 'MH003', name: 'Toán cao cấp', credits: 3, department: 'Khoa học cơ bản', semester: 'HK1-2024' },
    { subjectId: 'MH004', name: 'Tiếng Anh chuyên ngành', credits: 2, department: 'Ngoại ngữ', semester: 'HK1-2024' },
    { subjectId: 'MH005', name: 'Mạng máy tính', credits: 3, department: 'Công nghệ thông tin', semester: 'HK2-2024' },
    { subjectId: 'MH006', name: 'Lập trình Web', credits: 4, department: 'Công nghệ thông tin', semester: 'HK2-2024' },
    { subjectId: 'MH007', name: 'Kinh tế vi mô', credits: 3, department: 'Kinh tế', semester: 'HK1-2024' },
    { subjectId: 'MH008', name: 'Quản trị học', credits: 3, department: 'Quản trị kinh doanh', semester: 'HK1-2024' },
  ];

  const savedStudents = students.map(s => addStudent(s));
  const savedSubjects = subjects.map(s => addSubject(s));

  // Sample grades
  const gradeData: { studentIdx: number; subjectIdx: number; attendance: number; midterm: number; final: number; semester: string }[] = [
    { studentIdx: 0, subjectIdx: 0, attendance: 9, midterm: 8.5, final: 7.5, semester: 'HK1-2024' },
    { studentIdx: 0, subjectIdx: 1, attendance: 8, midterm: 7, final: 8, semester: 'HK1-2024' },
    { studentIdx: 0, subjectIdx: 2, attendance: 7, midterm: 6.5, final: 7, semester: 'HK1-2024' },
    { studentIdx: 0, subjectIdx: 3, attendance: 9, midterm: 8, final: 8.5, semester: 'HK1-2024' },
    { studentIdx: 0, subjectIdx: 4, attendance: 8, midterm: 7.5, final: 9, semester: 'HK2-2024' },
    { studentIdx: 0, subjectIdx: 5, attendance: 9, midterm: 8, final: 8, semester: 'HK2-2024' },
    { studentIdx: 1, subjectIdx: 0, attendance: 10, midterm: 9, final: 9.5, semester: 'HK1-2024' },
    { studentIdx: 1, subjectIdx: 1, attendance: 9, midterm: 8.5, final: 9, semester: 'HK1-2024' },
    { studentIdx: 1, subjectIdx: 2, attendance: 8, midterm: 7.5, final: 8.5, semester: 'HK1-2024' },
    { studentIdx: 1, subjectIdx: 4, attendance: 9, midterm: 9, final: 8.5, semester: 'HK2-2024' },
    { studentIdx: 2, subjectIdx: 0, attendance: 7, midterm: 6, final: 5.5, semester: 'HK1-2024' },
    { studentIdx: 2, subjectIdx: 1, attendance: 6, midterm: 5.5, final: 6, semester: 'HK1-2024' },
    { studentIdx: 2, subjectIdx: 2, attendance: 8, midterm: 7, final: 6.5, semester: 'HK1-2024' },
    { studentIdx: 2, subjectIdx: 5, attendance: 7, midterm: 6.5, final: 7, semester: 'HK2-2024' },
    { studentIdx: 3, subjectIdx: 0, attendance: 9, midterm: 8, final: 8.5, semester: 'HK1-2024' },
    { studentIdx: 3, subjectIdx: 1, attendance: 8, midterm: 9, final: 8, semester: 'HK1-2024' },
    { studentIdx: 3, subjectIdx: 3, attendance: 10, midterm: 9, final: 9, semester: 'HK1-2024' },
    { studentIdx: 4, subjectIdx: 0, attendance: 5, midterm: 4, final: 3.5, semester: 'HK1-2024' },
    { studentIdx: 4, subjectIdx: 1, attendance: 6, midterm: 5, final: 4, semester: 'HK1-2024' },
    { studentIdx: 4, subjectIdx: 2, attendance: 7, midterm: 6, final: 5, semester: 'HK1-2024' },
    { studentIdx: 5, subjectIdx: 6, attendance: 9, midterm: 8.5, final: 8, semester: 'HK1-2024' },
    { studentIdx: 5, subjectIdx: 7, attendance: 8, midterm: 7.5, final: 9, semester: 'HK1-2024' },
    { studentIdx: 6, subjectIdx: 6, attendance: 7, midterm: 6.5, final: 7, semester: 'HK1-2024' },
    { studentIdx: 6, subjectIdx: 7, attendance: 8, midterm: 7, final: 7.5, semester: 'HK1-2024' },
    { studentIdx: 7, subjectIdx: 2, attendance: 9, midterm: 8.5, final: 9, semester: 'HK1-2024' },
    { studentIdx: 7, subjectIdx: 6, attendance: 10, midterm: 9, final: 9.5, semester: 'HK1-2024' },
  ];

  gradeData.forEach(g => {
    addGrade({
      studentId: savedStudents[g.studentIdx].id,
      subjectId: savedSubjects[g.subjectIdx].id,
      attendanceScore: g.attendance,
      midtermScore: g.midterm,
      finalScore: g.final,
      semester: g.semester,
    });
  });
}
