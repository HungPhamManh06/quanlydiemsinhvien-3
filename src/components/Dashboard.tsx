import { useMemo, useEffect, useState } from 'react';
import { Student, Subject, Grade, Tab } from '../types';
import { getGradePoint } from '../data';
import { Users, BookOpen, Award, TrendingUp, GraduationCap, BarChart3, ClipboardList, FileText, ArrowRight, Trophy, Medal } from 'lucide-react';

interface Props {
  students: Student[];
  subjects: Subject[];
  grades: Grade[];
  setActiveTab: (tab: Tab) => void;
}

// Animated counter hook
function useCountUp(target: number, duration = 1000): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function StatCard({
  label, value, subLabel, icon, gradient, shadowColor, onClick,
}: {
  label: string; value: string | number; subLabel: string;
  icon: React.ReactNode; gradient: string; shadowColor: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`text-left ${gradient} rounded-2xl p-5 text-white shadow-lg ${shadowColor}
        ${onClick ? `hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] cursor-pointer` : ''}
        transition-all duration-300 card-hover`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/75 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
          <p className="text-4xl font-black mt-1 leading-none animate-count-up">{value}</p>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
        <p className="text-white/70 text-xs font-medium">{subLabel}</p>
        {onClick && <ArrowRight className="w-4 h-4 text-white/60" />}
      </div>
    </Tag>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Chào buổi sáng', emoji: '🌅' };
  if (h < 17) return { text: 'Chào buổi chiều', emoji: '🌤️' };
  return { text: 'Chào buổi tối', emoji: '🌙' };
}

function getLetterGradeBadgeClass(lg: string): string {
  if (lg === 'A+' || lg === 'A') return 'badge-A-plus';
  if (lg === 'B+') return 'badge-B-plus';
  if (lg === 'B') return 'badge-B';
  if (lg === 'C+') return 'badge-C-plus';
  if (lg === 'C') return 'badge-C';
  if (lg === 'D+' || lg === 'D') return 'badge-D';
  if (lg === 'F') return 'badge-F';
  return 'bg-gray-100 text-gray-600';
}

export default function Dashboard({ students, subjects, grades, setActiveTab }: Props) {
  const greeting = getGreeting();

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalSubjects = subjects.length;
    const totalGrades = grades.length;
    const validGrades = grades.filter(g => g.averageScore !== null);
    const overallAvg = validGrades.length > 0
      ? validGrades.reduce((sum, g) => sum + (g.averageScore || 0), 0) / validGrades.length : 0;
    const excellent = validGrades.filter(g => (g.averageScore || 0) >= 9.0).length;
    const good = validGrades.filter(g => (g.averageScore || 0) >= 8.0 && (g.averageScore || 0) < 9.0).length;
    const fair = validGrades.filter(g => (g.averageScore || 0) >= 6.5 && (g.averageScore || 0) < 8.0).length;
    const average = validGrades.filter(g => (g.averageScore || 0) >= 5.0 && (g.averageScore || 0) < 6.5).length;
    const poor = validGrades.filter(g => (g.averageScore || 0) < 5.0).length;
    const passRate = validGrades.length > 0
      ? Math.round((validGrades.filter(g => (g.averageScore || 0) >= 5.0).length / validGrades.length) * 100) : 0;

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

    const classes = [...new Set(students.map(s => s.className))];
    const recentGrades = [...grades].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 6);

    return {
      totalStudents, totalSubjects, totalGrades, overallAvg,
      excellent, good, fair, average, poor, passRate,
      studentGPAs, classes, recentGrades, validGrades
    };
  }, [students, subjects, grades]);

  const animatedStudents = useCountUp(stats.totalStudents);
  const animatedSubjects = useCountUp(stats.totalSubjects);
  const animatedGrades = useCountUp(stats.totalGrades);

  const distribution = [
    { label: 'Xuất sắc', range: '≥9.0', count: stats.excellent, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Giỏi', range: '8.0–8.9', count: stats.good, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: 'Khá', range: '6.5–7.9', count: stats.fair, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    { label: 'Trung bình', range: '5.0–6.4', count: stats.average, color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
    { label: 'Yếu', range: '<5.0', count: stats.poor, color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  ];

  return (
    <div className="space-y-6 page-transition">
      {/* --- HEADER GREETING --- */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{greeting.emoji}</span>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{greeting.text}!</p>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Tổng Quan Hệ Thống</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200 rounded-xl px-4 py-2.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-blue-700">Hệ thống hoạt động bình thường</span>
        </div>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng Sinh Viên"
          value={animatedStudents}
          subLabel={`${stats.classes.length} lớp học`}
          icon={<Users className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"
          shadowColor="shadow-blue-500/25 hover:shadow-blue-500/40"
          onClick={() => setActiveTab('students')}
        />
        <StatCard
          label="Môn Học"
          value={animatedSubjects}
          subLabel={`${subjects.reduce((s, sub) => s + sub.credits, 0)} tín chỉ`}
          icon={<BookOpen className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600"
          shadowColor="shadow-emerald-500/25 hover:shadow-emerald-500/40"
          onClick={() => setActiveTab('subjects')}
        />
        <StatCard
          label="Bản Ghi Điểm"
          value={animatedGrades}
          subLabel={`${stats.validGrades.length} đã đầy đủ điểm`}
          icon={<Award className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700"
          shadowColor="shadow-violet-500/25 hover:shadow-violet-500/40"
          onClick={() => setActiveTab('grades')}
        />
        <StatCard
          label="Điểm TB Chung"
          value={stats.overallAvg.toFixed(2)}
          subLabel={`${stats.passRate}% đạt (≥5.0)`}
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
          shadowColor="shadow-amber-500/25"
        />
      </div>

      {/* --- QUICK ACTIONS --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-lg">⚡</span> Thao Tác Nhanh
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { tab: 'students' as Tab, label: 'Quản lý SV', icon: <Users className="w-4 h-4" />, color: 'hover:bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300' },
            { tab: 'subjects' as Tab, label: 'Quản lý MH', icon: <BookOpen className="w-4 h-4" />, color: 'hover:bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-300' },
            { tab: 'grades' as Tab, label: 'Nhập điểm', icon: <ClipboardList className="w-4 h-4" />, color: 'hover:bg-violet-50 text-violet-700 border-violet-100 hover:border-violet-300' },
            { tab: 'transcript' as Tab, label: 'Bảng điểm', icon: <FileText className="w-4 h-4" />, color: 'hover:bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-300' },
          ].map(({ tab, label, icon, color }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border bg-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium text-sm shadow-sm hover:shadow-md ${color}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* --- DISTRIBUTION + TOP STUDENTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Grade Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-500" /> Phân Bố Xếp Loại
          </h2>
          <div className="space-y-3">
            {distribution.map((item, i) => {
              const total = stats.validGrades.length || 1;
              const pct = (item.count / total) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                    <p className="text-[10px] text-gray-400">{item.range}</p>
                  </div>
                  <div className={`flex-1 ${item.bg} rounded-full h-7 overflow-hidden relative`}>
                    <div
                      className={`${item.color} h-full rounded-full flex items-center justify-end pr-2.5 transition-all`}
                      style={{ width: `${Math.max(pct, 3)}%`, animationDelay: `${i * 100}ms` }}
                    >
                      {pct > 12 && <span className="text-white text-[11px] font-bold">{item.count}</span>}
                    </div>
                    {pct <= 12 && item.count > 0 && (
                      <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold ${item.text}`}>{item.count}</span>
                    )}
                  </div>
                  <div className="w-12 text-right text-xs font-bold text-gray-600 shrink-0">{pct.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Tổng: <strong className="text-gray-700">{stats.validGrades.length}</strong> bài thi có điểm</span>
            <button onClick={() => setActiveTab('statistics')} className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
              Xem thống kê <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Top Sinh Viên GPA Cao
          </h2>
          <div className="space-y-2.5">
            {stats.studentGPAs.filter(x => x.gpa > 0).slice(0, 5).map((item, index) => {
              const initials = item.student.name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
              const avatarColors = [
                'from-amber-400 to-yellow-500',
                'from-slate-400 to-gray-500',
                'from-amber-700 to-amber-800',
                'from-blue-400 to-blue-600',
                'from-purple-400 to-purple-600',
              ];
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={item.student.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50/60 transition-all group cursor-default"
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0
                    bg-gradient-to-br ${avatarColors[index] || 'from-gray-300 to-gray-400'} text-white shadow-sm`}>
                    {index < 3 ? medals[index] : <span className="text-white">{index + 1}</span>}
                  </div>
                  {/* Avatar */}
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                    {initials}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.student.name}</p>
                    <p className="text-xs text-gray-500 truncate">{item.student.studentId} · {item.student.className}</p>
                  </div>
                  {/* GPA */}
                  <div className="text-right shrink-0">
                    <p className={`font-black text-lg leading-tight ${
                      item.gpa >= 3.6 ? 'text-emerald-600' : item.gpa >= 3.0 ? 'text-blue-600' : 'text-amber-600'
                    }`}>{item.gpa.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">{item.totalCredits} TC</p>
                  </div>
                </div>
              );
            })}
            {stats.studentGPAs.filter(x => x.gpa > 0).length === 0 && (
              <div className="text-center py-10">
                <Medal className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Chưa có dữ liệu GPA</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- RECENT GRADES --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <span>🕐</span> Điểm Nhập Gần Đây
          </h2>
          <button onClick={() => setActiveTab('grades')} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {stats.recentGrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Sinh viên</th>
                  <th className="px-5 py-3 font-semibold">Môn học</th>
                  <th className="px-5 py-3 font-semibold text-center">CC</th>
                  <th className="px-5 py-3 font-semibold text-center">GK</th>
                  <th className="px-5 py-3 font-semibold text-center">CK</th>
                  <th className="px-5 py-3 font-semibold text-center">TB</th>
                  <th className="px-5 py-3 font-semibold text-center">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentGrades.map(grade => {
                  const student = students.find(s => s.id === grade.studentId);
                  const subject = subjects.find(s => s.id === grade.subjectId);
                  const initials = student?.name?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() ?? '?';
                  return (
                    <tr key={grade.id} className="border-t border-gray-50 hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-xs leading-tight">{student?.name || 'N/A'}</p>
                            <p className="text-gray-400 text-[10px]">{student?.className}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-gray-700 font-medium text-xs">{subject?.name || 'N/A'}</p>
                        <p className="text-gray-400 text-[10px]">{subject?.credits} TC</p>
                      </td>
                      <td className="px-5 py-3 text-center text-xs text-gray-600">{grade.attendanceScore ?? '-'}</td>
                      <td className="px-5 py-3 text-center text-xs text-gray-600">{grade.midtermScore ?? '-'}</td>
                      <td className="px-5 py-3 text-center text-xs text-gray-600">{grade.finalScore ?? '-'}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-base font-black ${
                          (grade.averageScore || 0) >= 8.5 ? 'text-emerald-600' :
                          (grade.averageScore || 0) >= 7.0 ? 'text-blue-600' :
                          (grade.averageScore || 0) >= 5.0 ? 'text-amber-600' : 'text-red-600'
                        }`}>{grade.averageScore?.toFixed(1) ?? '-'}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getLetterGradeBadgeClass(grade.letterGrade)}`}>
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
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Chưa có dữ liệu điểm</p>
            <button onClick={() => setActiveTab('grades')}
              className="mt-3 text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-1">
              Nhập điểm ngay <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
