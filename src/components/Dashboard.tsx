import { useMemo } from 'react';
import { Student, Subject, Grade, Tab } from '../types';
import { getGradePoint } from '../data';
import { Users, BookOpen, Award, TrendingUp, GraduationCap, BarChart3, ClipboardList, FileText } from 'lucide-react';

interface Props {
  students: Student[];
  subjects: Subject[];
  grades: Grade[];
  setActiveTab: (tab: Tab) => void;
}

export default function Dashboard({ students, subjects, grades, setActiveTab }: Props) {
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalSubjects = subjects.length;
    const totalGrades = grades.length;

    // Calculate overall average
    const validGrades = grades.filter(g => g.averageScore !== null);
    const overallAvg = validGrades.length > 0
      ? validGrades.reduce((sum, g) => sum + (g.averageScore || 0), 0) / validGrades.length
      : 0;

    // Classification
    const excellent = validGrades.filter(g => (g.averageScore || 0) >= 9.0).length;
    const good = validGrades.filter(g => (g.averageScore || 0) >= 8.0 && (g.averageScore || 0) < 9.0).length;
    const fair = validGrades.filter(g => (g.averageScore || 0) >= 6.5 && (g.averageScore || 0) < 8.0).length;
    const average = validGrades.filter(g => (g.averageScore || 0) >= 5.0 && (g.averageScore || 0) < 6.5).length;
    const poor = validGrades.filter(g => (g.averageScore || 0) < 5.0).length;

    // Top students by GPA
    const studentGPAs = students.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id && g.averageScore !== null);
      if (studentGrades.length === 0) return { student, gpa: 0, totalCredits: 0 };

      let totalWeightedGrade = 0;
      let totalCredits = 0;
      studentGrades.forEach(g => {
        const subject = subjects.find(s => s.id === g.subjectId);
        if (subject) {
          totalWeightedGrade += getGradePoint(g.letterGrade) * subject.credits;
          totalCredits += subject.credits;
        }
      });
      const gpa = totalCredits > 0 ? totalWeightedGrade / totalCredits : 0;
      return { student, gpa: Math.round(gpa * 100) / 100, totalCredits };
    }).sort((a, b) => b.gpa - a.gpa);

    // Classes
    const classes = [...new Set(students.map(s => s.className))];

    // Recent grades
    const recentGrades = [...grades].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);

    return {
      totalStudents, totalSubjects, totalGrades, overallAvg,
      excellent, good, fair, average, poor,
      studentGPAs, classes, recentGrades, validGrades
    };
  }, [students, subjects, grades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Tổng Quan</h1>
          <p className="text-gray-500 mt-1">Bảng điều khiển quản lý điểm sinh viên</p>
        </div>
        <div className="text-sm text-gray-500">
          Cập nhật: {new Date().toLocaleDateString('vi-VN')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <button onClick={() => setActiveTab('students')} className="text-left bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Tổng sinh viên</p>
              <p className="text-3xl font-bold mt-1">{stats.totalStudents}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3"><Users className="w-6 h-6" /></div>
          </div>
          <p className="text-blue-100 text-xs mt-3">{stats.classes.length} lớp học</p>
        </button>

        <button onClick={() => setActiveTab('subjects')} className="text-left bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Tổng môn học</p>
              <p className="text-3xl font-bold mt-1">{stats.totalSubjects}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3"><BookOpen className="w-6 h-6" /></div>
          </div>
          <p className="text-emerald-100 text-xs mt-3">{subjects.reduce((s, sub) => s + sub.credits, 0)} tín chỉ</p>
        </button>

        <button onClick={() => setActiveTab('grades')} className="text-left bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm font-medium">Bảng điểm</p>
              <p className="text-3xl font-bold mt-1">{stats.totalGrades}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3"><Award className="w-6 h-6" /></div>
          </div>
          <p className="text-violet-100 text-xs mt-3">{stats.validGrades.length} đã có điểm đầy đủ</p>
        </button>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Điểm TB chung</p>
              <p className="text-3xl font-bold mt-1">{stats.overallAvg.toFixed(2)}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3"><TrendingUp className="w-6 h-6" /></div>
          </div>
          <p className="text-amber-100 text-xs mt-3">Tất cả sinh viên</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">⚡ Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => setActiveTab('students')} className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">
            <Users className="w-5 h-5" />
            <span className="font-medium text-sm">Quản lý SV</span>
          </button>
          <button onClick={() => setActiveTab('subjects')} className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors">
            <BookOpen className="w-5 h-5" />
            <span className="font-medium text-sm">Quản lý MH</span>
          </button>
          <button onClick={() => setActiveTab('grades')} className="flex items-center gap-3 p-4 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 transition-colors">
            <ClipboardList className="w-5 h-5" />
            <span className="font-medium text-sm">Nhập điểm</span>
          </button>
          <button onClick={() => setActiveTab('transcript')} className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors">
            <FileText className="w-5 h-5" />
            <span className="font-medium text-sm">Bảng điểm</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-500" /> Phân bố xếp loại điểm
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Xuất sắc (≥9.0)', count: stats.excellent, color: 'bg-emerald-500', bgColor: 'bg-emerald-100' },
              { label: 'Giỏi (8.0 - 8.9)', count: stats.good, color: 'bg-blue-500', bgColor: 'bg-blue-100' },
              { label: 'Khá (6.5 - 7.9)', count: stats.fair, color: 'bg-amber-500', bgColor: 'bg-amber-100' },
              { label: 'TB (5.0 - 6.4)', count: stats.average, color: 'bg-orange-500', bgColor: 'bg-orange-100' },
              { label: 'Yếu (<5.0)', count: stats.poor, color: 'bg-red-500', bgColor: 'bg-red-100' },
            ].map(item => {
              const total = stats.validGrades.length || 1;
              const pct = (item.count / total) * 100;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-gray-600 font-medium">{item.label}</div>
                  <div className={`flex-1 ${item.bgColor} rounded-full h-6 overflow-hidden`}>
                    <div className={`${item.color} h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500`} style={{ width: `${Math.max(pct, 2)}%` }}>
                      {pct > 10 && <span className="text-white text-xs font-bold">{item.count}</span>}
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-semibold text-gray-700">{pct.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-500" /> Top Sinh Viên GPA Cao
          </h2>
          <div className="space-y-3">
            {stats.studentGPAs.slice(0, 5).map((item, index) => (
              <div key={item.student.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-amber-400 text-white' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-amber-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{item.student.name}</p>
                  <p className="text-xs text-gray-500">{item.student.studentId} • {item.student.className}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-blue-600">{item.gpa.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{item.totalCredits} TC</p>
                </div>
              </div>
            ))}
            {stats.studentGPAs.length === 0 && (
              <p className="text-gray-400 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Grades */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🕐 Điểm Nhập Gần Đây</h2>
        {stats.recentGrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Sinh viên</th>
                  <th className="pb-3 font-medium">Môn học</th>
                  <th className="pb-3 font-medium text-center">CC</th>
                  <th className="pb-3 font-medium text-center">GK</th>
                  <th className="pb-3 font-medium text-center">CK</th>
                  <th className="pb-3 font-medium text-center">TB</th>
                  <th className="pb-3 font-medium text-center">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentGrades.map(grade => {
                  const student = students.find(s => s.id === grade.studentId);
                  const subject = subjects.find(s => s.id === grade.subjectId);
                  return (
                    <tr key={grade.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">{student?.name || 'N/A'}</td>
                      <td className="py-3 text-gray-600">{subject?.name || 'N/A'}</td>
                      <td className="py-3 text-center">{grade.attendanceScore ?? '-'}</td>
                      <td className="py-3 text-center">{grade.midtermScore ?? '-'}</td>
                      <td className="py-3 text-center">{grade.finalScore ?? '-'}</td>
                      <td className="py-3 text-center font-bold text-blue-600">{grade.averageScore?.toFixed(2) ?? '-'}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          grade.letterGrade === 'A+' || grade.letterGrade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                          grade.letterGrade === 'B+' || grade.letterGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                          grade.letterGrade === 'C+' || grade.letterGrade === 'C' ? 'bg-amber-100 text-amber-700' :
                          grade.letterGrade === 'F' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {grade.letterGrade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Chưa có dữ liệu điểm</p>
        )}
      </div>
    </div>
  );
}
