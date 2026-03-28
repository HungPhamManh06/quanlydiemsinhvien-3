import { useMemo, useState } from 'react';
import { Student, Subject, Grade } from '../types';
import { getGradePoint } from '../data';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

interface Props {
  students: Student[];
  subjects: Subject[];
  grades: Grade[];
}

export default function Statistics({ students, subjects, grades }: Props) {
  const [filterClass, setFilterClass] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const classes = useMemo(() => [...new Set(students.map(s => s.className))].sort(), [students]);
  const semesters = useMemo(() => [...new Set(grades.map(g => g.semester))].filter(Boolean).sort(), [grades]);

  const data = useMemo(() => {
    // Filter grades
    let filteredGrades = grades;
    if (filterSemester) {
      filteredGrades = filteredGrades.filter(g => g.semester === filterSemester);
    }
    if (filterClass) {
      const classStudentIds = students.filter(s => s.className === filterClass).map(s => s.id);
      filteredGrades = filteredGrades.filter(g => classStudentIds.includes(g.studentId));
    }

    const validGrades = filteredGrades.filter(g => g.averageScore !== null);

    // Grade distribution for pie
    const gradeDistribution = [
      { name: 'Xuất sắc (A+, A)', value: validGrades.filter(g => ['A+', 'A'].includes(g.letterGrade)).length, color: '#10b981' },
      { name: 'Giỏi (B+, B)', value: validGrades.filter(g => ['B+', 'B'].includes(g.letterGrade)).length, color: '#3b82f6' },
      { name: 'Khá (C+, C)', value: validGrades.filter(g => ['C+', 'C'].includes(g.letterGrade)).length, color: '#f59e0b' },
      { name: 'TB (D+, D)', value: validGrades.filter(g => ['D+', 'D'].includes(g.letterGrade)).length, color: '#f97316' },
      { name: 'Yếu (F)', value: validGrades.filter(g => g.letterGrade === 'F').length, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Score range distribution for bar chart
    const scoreRanges = [
      { range: '0-1', count: validGrades.filter(g => (g.averageScore || 0) < 1).length },
      { range: '1-2', count: validGrades.filter(g => (g.averageScore || 0) >= 1 && (g.averageScore || 0) < 2).length },
      { range: '2-3', count: validGrades.filter(g => (g.averageScore || 0) >= 2 && (g.averageScore || 0) < 3).length },
      { range: '3-4', count: validGrades.filter(g => (g.averageScore || 0) >= 3 && (g.averageScore || 0) < 4).length },
      { range: '4-5', count: validGrades.filter(g => (g.averageScore || 0) >= 4 && (g.averageScore || 0) < 5).length },
      { range: '5-6', count: validGrades.filter(g => (g.averageScore || 0) >= 5 && (g.averageScore || 0) < 6).length },
      { range: '6-7', count: validGrades.filter(g => (g.averageScore || 0) >= 6 && (g.averageScore || 0) < 7).length },
      { range: '7-8', count: validGrades.filter(g => (g.averageScore || 0) >= 7 && (g.averageScore || 0) < 8).length },
      { range: '8-9', count: validGrades.filter(g => (g.averageScore || 0) >= 8 && (g.averageScore || 0) < 9).length },
      { range: '9-10', count: validGrades.filter(g => (g.averageScore || 0) >= 9).length },
    ];

    // Subject average scores
    const subjectStats = subjects.map(subject => {
      const subGrades = filteredGrades.filter(g => g.subjectId === subject.id && g.averageScore !== null);
      const avg = subGrades.length > 0 ? subGrades.reduce((s, g) => s + (g.averageScore || 0), 0) / subGrades.length : 0;
      const passRate = subGrades.length > 0 ? (subGrades.filter(g => (g.averageScore || 0) >= 4).length / subGrades.length) * 100 : 0;
      return {
        name: subject.name.length > 15 ? subject.name.substring(0, 15) + '...' : subject.name,
        fullName: subject.name,
        avg: Math.round(avg * 100) / 100,
        passRate: Math.round(passRate),
        count: subGrades.length,
      };
    }).filter(s => s.count > 0).sort((a, b) => b.avg - a.avg);

    // Class comparison
    const classStats = classes.map(className => {
      const classStudentIds = students.filter(s => s.className === className).map(s => s.id);
      const classGrades = filteredGrades.filter(g => classStudentIds.includes(g.studentId) && g.averageScore !== null);
      const avg = classGrades.length > 0 ? classGrades.reduce((s, g) => s + (g.averageScore || 0), 0) / classGrades.length : 0;

      // Calculate class GPA
      let totalWeighted = 0;
      let totalCredits = 0;
      classGrades.forEach(g => {
        const subject = subjects.find(s => s.id === g.subjectId);
        if (subject) {
          totalWeighted += getGradePoint(g.letterGrade) * subject.credits;
          totalCredits += subject.credits;
        }
      });
      const gpa = totalCredits > 0 ? totalWeighted / totalCredits : 0;

      return {
        name: className,
        avg: Math.round(avg * 100) / 100,
        gpa: Math.round(gpa * 100) / 100,
        students: classStudentIds.length,
      };
    }).filter(c => c.avg > 0);

    // GPA by semester trend (line chart)
    const semesterTrend = semesters.map(semester => {
      const semGrades = grades.filter(g => g.semester === semester && g.averageScore !== null);
      let totalWeighted = 0;
      let totalCredits = 0;
      semGrades.forEach(g => {
        const subject = subjects.find(s => s.id === g.subjectId);
        if (subject) {
          totalWeighted += getGradePoint(g.letterGrade) * subject.credits;
          totalCredits += subject.credits;
        }
      });
      const gpa = totalCredits > 0 ? totalWeighted / totalCredits : 0;
      const avg = semGrades.length > 0 ? semGrades.reduce((s, g) => s + (g.averageScore || 0), 0) / semGrades.length : 0;
      return {
        semester,
        gpa: Math.round(gpa * 100) / 100,
        avg: Math.round(avg * 100) / 100,
      };
    });

    // Summary stats
    const totalValidGrades = validGrades.length;
    const avgScore = totalValidGrades > 0 ? validGrades.reduce((s, g) => s + (g.averageScore || 0), 0) / totalValidGrades : 0;
    const passCount = validGrades.filter(g => (g.averageScore || 0) >= 4).length;
    const passRate = totalValidGrades > 0 ? (passCount / totalValidGrades) * 100 : 0;
    const excellentCount = validGrades.filter(g => (g.averageScore || 0) >= 9).length;
    const excellentRate = totalValidGrades > 0 ? (excellentCount / totalValidGrades) * 100 : 0;

    return {
      gradeDistribution, scoreRanges, subjectStats, classStats,
      semesterTrend, totalValidGrades, avgScore, passRate, excellentRate,
    };
  }, [students, subjects, grades, filterClass, filterSemester, classes, semesters]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-indigo-500" /> Thống Kê & Báo Cáo
          </h1>
          <p className="text-gray-500 mt-1">Phân tích kết quả học tập toàn trường</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white min-w-[160px]">
          <option value="">Tất cả học kỳ</option>
          {semesters.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white min-w-[160px]">
          <option value="">Tất cả lớp</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-sm text-gray-500">Tổng bài thi</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalValidGrades}</p>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-sm text-gray-500">Điểm TB chung</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{data.avgScore.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-sm text-gray-500">Tỷ lệ đạt (≥4.0)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{data.passRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-sm text-gray-500">Tỷ lệ xuất sắc (≥9.0)</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{data.excellentRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 Phân Bố Xếp Loại</h2>
          {data.gradeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={true}
                >
                  {data.gradeDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Score Distribution Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Phân Bố Điểm Số</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.scoreRanges}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Số lượng" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📚 Điểm TB Theo Môn Học</h2>
          {data.subjectStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.subjectStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
                        <p className="font-bold">{d.fullName}</p>
                        <p>Điểm TB: <strong>{d.avg}</strong></p>
                        <p>Tỷ lệ đạt: <strong>{d.passRate}%</strong></p>
                        <p>Số bài: <strong>{d.count}</strong></p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="avg" name="Điểm TB" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Class Comparison */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🏫 So Sánh Giữa Các Lớp</h2>
          {data.classStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.classStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
                        <p className="font-bold">{d.name}</p>
                        <p>Điểm TB: <strong>{d.avg}</strong></p>
                        <p>GPA: <strong>{d.gpa}</strong></p>
                        <p>Sinh viên: <strong>{d.students}</strong></p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend />
                <Bar dataKey="avg" name="Điểm TB (hệ 10)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gpa" name="GPA (hệ 4)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Semester Trend */}
      {data.semesterTrend.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📈 Xu Hướng Điểm Qua Các Học Kỳ</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.semesterTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avg" name="Điểm TB (hệ 10)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
              <Line type="monotone" dataKey="gpa" name="GPA (hệ 4)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Subject Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">📋 Chi Tiết Theo Môn Học</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Môn học</th>
                <th className="px-6 py-3 font-medium text-center">Số bài thi</th>
                <th className="px-6 py-3 font-medium text-center">Điểm TB</th>
                <th className="px-6 py-3 font-medium text-center">Tỷ lệ đạt</th>
                <th className="px-6 py-3 font-medium text-center">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {data.subjectStats.map((sub, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{sub.fullName}</td>
                  <td className="px-6 py-3 text-center">{sub.count}</td>
                  <td className="px-6 py-3 text-center font-bold text-blue-600">{sub.avg.toFixed(2)}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${sub.passRate >= 80 ? 'bg-emerald-500' : sub.passRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${sub.passRate}%` }}></div>
                      </div>
                      <span className="font-semibold">{sub.passRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      sub.avg >= 8 ? 'bg-emerald-100 text-emerald-700' :
                      sub.avg >= 6.5 ? 'bg-blue-100 text-blue-700' :
                      sub.avg >= 5 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {sub.avg >= 8 ? 'Tốt' : sub.avg >= 6.5 ? 'Khá' : sub.avg >= 5 ? 'TB' : 'Yếu'}
                    </span>
                  </td>
                </tr>
              ))}
              {data.subjectStats.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Chưa có dữ liệu thống kê</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
