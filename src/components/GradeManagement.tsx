import { useState, useMemo } from 'react';
import { Student, Subject, Grade } from '../types';
import * as api from '../api';
import { Plus, Search, Edit2, Trash2, X, ClipboardList, ClipboardPlus, Loader2 } from 'lucide-react';

interface Props {
  students: Student[];
  subjects: Subject[];
  grades: Grade[];
  onRefresh: () => Promise<void>;
}

export default function GradeManagement({ students, subjects, grades, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    studentId: '', subjectId: '', semester: '',
    attendanceScore: '' as string, midtermScore: '' as string, finalScore: '' as string,
  });
  const [search, setSearch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const semesters = useMemo(() => [...new Set(grades.map(g => g.semester).concat(subjects.map(s => s.semester)))].filter(Boolean).sort(), [grades, subjects]);

  const filtered = useMemo(() => {
    return grades.filter(g => {
      const student = students.find(s => s.id === g.studentId);
      const subject = subjects.find(s => s.id === g.subjectId);
      const matchSearch = !search ||
        student?.name.toLowerCase().includes(search.toLowerCase()) ||
        student?.studentId.toLowerCase().includes(search.toLowerCase()) ||
        subject?.name.toLowerCase().includes(search.toLowerCase());
      const matchSemester = !filterSemester || g.semester === filterSemester;
      const matchSubject = !filterSubject || g.subjectId === filterSubject;
      return matchSearch && matchSemester && matchSubject;
    });
  }, [grades, students, subjects, search, filterSemester, filterSubject]);

  const validateScore = (val: string): boolean => {
    if (val === '') return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 10;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.studentId) errs.studentId = 'Chọn sinh viên';
    if (!form.subjectId) errs.subjectId = 'Chọn môn học';
    if (!form.semester.trim()) errs.semester = 'Nhập học kỳ';
    if (form.attendanceScore && !validateScore(form.attendanceScore)) errs.attendanceScore = 'Điểm 0-10';
    if (form.midtermScore && !validateScore(form.midtermScore)) errs.midtermScore = 'Điểm 0-10';
    if (form.finalScore && !validateScore(form.finalScore)) errs.finalScore = 'Điểm 0-10';
    if (!editingId) {
      const existing = grades.find(g => g.studentId === form.studentId && g.subjectId === form.subjectId && g.semester === form.semester);
      if (existing) errs.studentId = 'Sinh viên đã có điểm môn này trong học kỳ này';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        studentId: form.studentId,
        subjectId: form.subjectId,
        semester: form.semester,
        attendanceScore: form.attendanceScore ? parseFloat(form.attendanceScore) : null,
        midtermScore: form.midtermScore ? parseFloat(form.midtermScore) : null,
        finalScore: form.finalScore ? parseFloat(form.finalScore) : null,
      };
      if (editingId) {
        await api.updateGrade(editingId, data);
      } else {
        await api.addGrade(data);
      }
      await onRefresh();
      resetForm();
    } catch (err) {
      console.error('Error saving grade:', err);
      alert('Lỗi khi lưu điểm. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (grade: Grade) => {
    setForm({
      studentId: grade.studentId,
      subjectId: grade.subjectId,
      semester: grade.semester,
      attendanceScore: grade.attendanceScore?.toString() ?? '',
      midtermScore: grade.midtermScore?.toString() ?? '',
      finalScore: grade.finalScore?.toString() ?? '',
    });
    setEditingId(grade.id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (grade: Grade) => {
    const student = students.find(s => s.id === grade.studentId);
    const subject = subjects.find(s => s.id === grade.subjectId);
    if (confirm(`Xóa điểm "${subject?.name}" của "${student?.name}"?`)) {
      try {
        await api.deleteGrade(grade.id);
        await onRefresh();
      } catch (err) {
        console.error('Error deleting grade:', err);
        alert('Lỗi khi xóa điểm.');
      }
    }
  };

  const resetForm = () => {
    setForm({ studentId: '', subjectId: '', semester: '', attendanceScore: '', midtermScore: '', finalScore: '' });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 8.5) return 'text-emerald-600 font-bold';
    if (score >= 7.0) return 'text-blue-600 font-semibold';
    if (score >= 5.5) return 'text-amber-600';
    if (score >= 4.0) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-violet-500" /> Quản Lý Điểm
          </h1>
          <p className="text-gray-500 mt-1">Tổng cộng {grades.length} bản ghi điểm</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/20 font-medium"
        >
          <ClipboardPlus className="w-4 h-4" /> Nhập Điểm
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Tìm theo tên SV, mã SV, tên môn..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
          />
        </div>
        <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white min-w-[140px]">
          <option value="">Tất cả HK</option>
          {semesters.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white min-w-[160px]">
          <option value="">Tất cả môn</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={resetForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">{editingId ? '✏️ Sửa Điểm' : '➕ Nhập Điểm Mới'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sinh viên *</label>
                <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}
                  disabled={!!editingId}
                  className={`w-full px-3 py-2 rounded-lg border ${errors.studentId ? 'border-red-500' : 'border-gray-200'} outline-none bg-white disabled:bg-gray-100`}>
                  <option value="">-- Chọn sinh viên --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.studentId} - {s.name} ({s.className})</option>)}
                </select>
                {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Môn học *</label>
                  <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}
                    disabled={!!editingId}
                    className={`w-full px-3 py-2 rounded-lg border ${errors.subjectId ? 'border-red-500' : 'border-gray-200'} outline-none bg-white disabled:bg-gray-100`}>
                    <option value="">-- Chọn môn --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectId} - {s.name}</option>)}
                  </select>
                  {errors.subjectId && <p className="text-red-500 text-xs mt-1">{errors.subjectId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ *</label>
                  <input type="text" value={form.semester}
                    onChange={e => setForm({ ...form, semester: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${errors.semester ? 'border-red-500' : 'border-gray-200'} outline-none`}
                    placeholder="VD: HK1-2024"
                  />
                  {errors.semester && <p className="text-red-500 text-xs mt-1">{errors.semester}</p>}
                </div>
              </div>

              <div className="bg-violet-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-violet-700 mb-3">📝 Điểm số (thang 10)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Chuyên cần (10%)</label>
                    <input type="number" step="0.1" min="0" max="10" value={form.attendanceScore}
                      onChange={e => setForm({ ...form, attendanceScore: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${errors.attendanceScore ? 'border-red-500' : 'border-gray-200'} outline-none text-center font-semibold`}
                      placeholder="0-10"
                    />
                    {errors.attendanceScore && <p className="text-red-500 text-xs mt-1">{errors.attendanceScore}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Giữa kỳ (30%)</label>
                    <input type="number" step="0.1" min="0" max="10" value={form.midtermScore}
                      onChange={e => setForm({ ...form, midtermScore: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${errors.midtermScore ? 'border-red-500' : 'border-gray-200'} outline-none text-center font-semibold`}
                      placeholder="0-10"
                    />
                    {errors.midtermScore && <p className="text-red-500 text-xs mt-1">{errors.midtermScore}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cuối kỳ (60%)</label>
                    <input type="number" step="0.1" min="0" max="10" value={form.finalScore}
                      onChange={e => setForm({ ...form, finalScore: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${errors.finalScore ? 'border-red-500' : 'border-gray-200'} outline-none text-center font-semibold`}
                      placeholder="0-10"
                    />
                    {errors.finalScore && <p className="text-red-500 text-xs mt-1">{errors.finalScore}</p>}
                  </div>
                </div>
                <p className="text-xs text-violet-500 mt-2">Công thức: TB = CC × 10% + GK × 30% + CK × 60%</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 font-medium flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editingId ? 'Cập nhật' : 'Lưu điểm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Sinh viên</th>
                <th className="px-4 py-3 font-semibold">Môn học</th>
                <th className="px-4 py-3 font-semibold">Học kỳ</th>
                <th className="px-4 py-3 font-semibold text-center">CC (10%)</th>
                <th className="px-4 py-3 font-semibold text-center">GK (30%)</th>
                <th className="px-4 py-3 font-semibold text-center">CK (60%)</th>
                <th className="px-4 py-3 font-semibold text-center">TB</th>
                <th className="px-4 py-3 font-semibold text-center">Xếp loại</th>
                <th className="px-4 py-3 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((grade, index) => {
                const student = students.find(s => s.id === grade.studentId);
                const subject = subjects.find(s => s.id === grade.subjectId);
                return (
                  <tr key={grade.id} className="border-t hover:bg-violet-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{student?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{student?.studentId} • {student?.className}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{subject?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{subject?.credits} tín chỉ</div>
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-medium">{grade.semester}</span></td>
                    <td className={`px-4 py-3 text-center ${getScoreColor(grade.attendanceScore)}`}>{grade.attendanceScore ?? '-'}</td>
                    <td className={`px-4 py-3 text-center ${getScoreColor(grade.midtermScore)}`}>{grade.midtermScore ?? '-'}</td>
                    <td className={`px-4 py-3 text-center ${getScoreColor(grade.finalScore)}`}>{grade.finalScore ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-lg font-bold ${getScoreColor(grade.averageScore)}`}>
                        {grade.averageScore?.toFixed(2) ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        grade.letterGrade === 'A+' || grade.letterGrade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                        grade.letterGrade === 'B+' || grade.letterGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                        grade.letterGrade === 'C+' || grade.letterGrade === 'C' ? 'bg-amber-100 text-amber-700' :
                        grade.letterGrade === 'D+' || grade.letterGrade === 'D' ? 'bg-orange-100 text-orange-700' :
                        grade.letterGrade === 'F' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {grade.letterGrade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(grade)} className="p-2 hover:bg-violet-100 rounded-lg text-violet-600" title="Sửa"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(grade)} className="p-2 hover:bg-red-100 rounded-lg text-red-600" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                  {search || filterSemester || filterSubject ? 'Không tìm thấy kết quả' : 'Chưa có điểm nào. Hãy nhập điểm mới!'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
