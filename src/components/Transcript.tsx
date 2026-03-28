import { useState, useMemo } from 'react';
import { Student, Subject, Grade } from '../types';
import { getGradePoint } from '../data';
import { FileText, Search, Printer, GraduationCap } from 'lucide-react';

interface Props {
  students: Student[];
  subjects: Subject[];
  grades: Grade[];
}

export default function Transcript({ students, subjects, grades }: Props) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [search, setSearch] = useState('');

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    return students.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
    );
  }, [students, search]);

  const student = useMemo(() => students.find(s => s.id === selectedStudent), [students, selectedStudent]);

  const transcript = useMemo(() => {
    if (!student) return null;

    const studentGrades = grades.filter(g => g.studentId === student.id);
    const semesters = [...new Set(studentGrades.map(g => g.semester))].sort();

    let overallWeightedGrade = 0;
    let overallCredits = 0;

    const semesterData = semesters.map(semester => {
      const semGrades = studentGrades.filter(g => g.semester === semester);
      let semWeighted = 0;
      let semCredits = 0;

      const rows = semGrades.map(grade => {
        const subject = subjects.find(s => s.id === grade.subjectId);
        const credits = subject?.credits || 0;
        const gp = getGradePoint(grade.letterGrade);
        semWeighted += gp * credits;
        semCredits += credits;
        return { grade, subject, gp };
      });

      const semGPA = semCredits > 0 ? semWeighted / semCredits : 0;
      overallWeightedGrade += semWeighted;
      overallCredits += semCredits;

      return { semester, rows, semGPA: Math.round(semGPA * 100) / 100, semCredits };
    });

    const cumulativeGPA = overallCredits > 0 ? Math.round((overallWeightedGrade / overallCredits) * 100) / 100 : 0;

    let classification = '';
    if (cumulativeGPA >= 3.6) classification = 'Xuất sắc';
    else if (cumulativeGPA >= 3.2) classification = 'Giỏi';
    else if (cumulativeGPA >= 2.5) classification = 'Khá';
    else if (cumulativeGPA >= 2.0) classification = 'Trung bình';
    else if (cumulativeGPA >= 1.0) classification = 'Yếu';
    else classification = 'Kém';

    return { semesterData, cumulativeGPA, overallCredits, classification };
  }, [student, grades, subjects]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-amber-500" /> Bảng Điểm Sinh Viên
          </h1>
          <p className="text-gray-500 mt-1">Xem bảng điểm chi tiết theo từng sinh viên</p>
        </div>
        {student && (
          <button onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-800 text-white px-5 py-2.5 rounded-xl hover:bg-gray-900 transition-colors font-medium print:hidden">
            <Printer className="w-4 h-4" /> In Bảng Điểm
          </button>
        )}
      </div>

      {/* Student Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 print:hidden">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🔍 Chọn Sinh Viên</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Tìm sinh viên..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white min-w-[300px]">
            <option value="">-- Chọn sinh viên --</option>
            {filteredStudents.map(s => (
              <option key={s.id} value={s.id}>{s.studentId} - {s.name} ({s.className})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transcript */}
      {student && transcript && (
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-6 h-6" />
                  <h2 className="text-xl font-bold">BẢNG ĐIỂM HỌC TẬP</h2>
                </div>
                <p className="text-blue-200 text-sm">Trường Đại Học - Hệ thống quản lý điểm</p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  transcript.cumulativeGPA >= 3.2 ? 'text-emerald-300' :
                  transcript.cumulativeGPA >= 2.5 ? 'text-amber-300' :
                  'text-red-300'
                }`}>
                  {transcript.cumulativeGPA.toFixed(2)}
                </div>
                <div className="text-blue-200 text-sm">GPA Tích lũy</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/20">
              <div>
                <p className="text-blue-200 text-xs">Mã sinh viên</p>
                <p className="font-bold">{student.studentId}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Họ và tên</p>
                <p className="font-bold">{student.name}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Lớp</p>
                <p className="font-bold">{student.className}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Xếp loại</p>
                <p className={`font-bold ${
                  transcript.classification === 'Xuất sắc' || transcript.classification === 'Giỏi' ? 'text-emerald-300' :
                  transcript.classification === 'Khá' ? 'text-amber-300' : 'text-red-300'
                }`}>{transcript.classification}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
              <div>
                <p className="text-blue-200 text-xs">Tổng tín chỉ tích lũy</p>
                <p className="font-bold">{transcript.overallCredits}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Ngày sinh</p>
                <p className="font-bold">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '-'}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Email</p>
                <p className="font-bold text-sm">{student.email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Semester Tables */}
          {transcript.semesterData.map(sem => (
            <div key={sem.semester} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
                <h3 className="font-bold text-gray-900">📅 {sem.semester}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">Tín chỉ: <strong className="text-gray-900">{sem.semCredits}</strong></span>
                  <span className="text-gray-500">GPA: <strong className={`text-lg ${
                    sem.semGPA >= 3.2 ? 'text-emerald-600' : sem.semGPA >= 2.5 ? 'text-amber-600' : 'text-red-600'
                  }`}>{sem.semGPA.toFixed(2)}</strong></span>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="px-6 py-3 font-medium">#</th>
                    <th className="px-6 py-3 font-medium">Mã MH</th>
                    <th className="px-6 py-3 font-medium">Tên môn học</th>
                    <th className="px-6 py-3 font-medium text-center">TC</th>
                    <th className="px-6 py-3 font-medium text-center">CC</th>
                    <th className="px-6 py-3 font-medium text-center">GK</th>
                    <th className="px-6 py-3 font-medium text-center">CK</th>
                    <th className="px-6 py-3 font-medium text-center">TB</th>
                    <th className="px-6 py-3 font-medium text-center">Điểm chữ</th>
                    <th className="px-6 py-3 font-medium text-center">Điểm hệ 4</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.rows.map((row, idx) => (
                    <tr key={row.grade.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-3 font-mono text-gray-600">{row.subject?.subjectId}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{row.subject?.name}</td>
                      <td className="px-6 py-3 text-center font-semibold">{row.subject?.credits}</td>
                      <td className="px-6 py-3 text-center">{row.grade.attendanceScore ?? '-'}</td>
                      <td className="px-6 py-3 text-center">{row.grade.midtermScore ?? '-'}</td>
                      <td className="px-6 py-3 text-center">{row.grade.finalScore ?? '-'}</td>
                      <td className="px-6 py-3 text-center font-bold text-blue-600">{row.grade.averageScore?.toFixed(2) ?? '-'}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          row.grade.letterGrade === 'A+' || row.grade.letterGrade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                          row.grade.letterGrade === 'B+' || row.grade.letterGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                          row.grade.letterGrade === 'C+' || row.grade.letterGrade === 'C' ? 'bg-amber-100 text-amber-700' :
                          row.grade.letterGrade === 'F' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{row.grade.letterGrade}</span>
                      </td>
                      <td className="px-6 py-3 text-center font-semibold">{row.gp.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {transcript.semesterData.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              Sinh viên chưa có điểm nào
            </div>
          )}
        </div>
      )}

      {!student && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">Chọn sinh viên để xem bảng điểm</h3>
          <p className="text-gray-400 mt-1">Sử dụng bộ lọc ở trên để tìm và chọn sinh viên</p>
        </div>
      )}
    </div>
  );
}
