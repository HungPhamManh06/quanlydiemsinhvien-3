export interface Student {
  id: string;
  studentId: string;
  name: string;
  className: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'Nam' | 'Nữ';
  address: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  subjectId: string;
  name: string;
  credits: number;
  department: string;
  semester: string;
  createdAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  attendanceScore: number | null;   // Điểm chuyên cần
  midtermScore: number | null;      // Điểm giữa kỳ
  finalScore: number | null;        // Điểm cuối kỳ
  averageScore: number | null;      // Điểm trung bình
  letterGrade: string;              // Điểm chữ
  semester: string;
  createdAt: string;
}

export type Tab = 'dashboard' | 'students' | 'subjects' | 'grades' | 'transcript' | 'statistics';

export type UserRole = 'admin' | 'teacher';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface SemesterGPA {
  semester: string;
  gpa: number;
  totalCredits: number;
}
