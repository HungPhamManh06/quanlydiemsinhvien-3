import { useState, useMemo } from 'react';
import { Subject } from '../types';
import * as api from '../api';
import { Plus, Search, Edit2, Trash2, X, BookOpen, BookPlus, Loader2 } from 'lucide-react';

interface Props {
  subjects: Subject[];
  onRefresh: () => Promise<void>;
}

const emptyForm = {
  subjectId: '', name: '', credits: 3, department: '', semester: '',
};

export default function SubjectManagement({ subjects, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const departments = useMemo(() => [...new Set(subjects.map(s => s.department))].filter(Boolean).sort(), [subjects]);
  const semesters = useMemo(() => [...new Set(subjects.map(s => s.semester))].filter(Boolean).sort(), [subjects]);

  const filtered = useMemo(() => {
    return subjects.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.subjectId.toLowerCase().includes(search.toLowerCase());
      const matchDept = !filterDept || s.department === filterDept;
      const matchSem = !filterSemester || s.semester === filterSemester;
      return matchSearch && matchDept && matchSem;
    });
  }, [subjects, search, filterDept, filterSemester]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.subjectId.trim()) errs.subjectId = 'Mã MH không được để trống';
    if (!form.name.trim()) errs.name = 'Tên MH không được để trống';
    if (form.credits < 1 || form.credits > 10) errs.credits = 'Số tín chỉ: 1-10';
    const existing = subjects.find(s => s.subjectId === form.subjectId && s.id !== editingId);
    if (existing) errs.subjectId = 'Mã MH đã tồn tại';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.updateSubject(editingId, form);
      } else {
        await api.addSubject(form);
      }
      await onRefresh();
      resetForm();
    } catch (err) {
      console.error('Error saving subject:', err);
      alert('Lỗi khi lưu môn học. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setForm({
      subjectId: subject.subjectId,
      name: subject.name,
      credits: subject.credits,
      department: subject.department,
      semester: subject.semester,
    });
    setEditingId(subject.id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (subject: Subject) => {
    if (confirm(`Bạn có chắc muốn xóa môn học "${subject.name}" (${subject.subjectId})?\nTất cả điểm liên quan cũng sẽ bị xóa.`)) {
      try {
        await api.deleteSubject(subject.id);
        await onRefresh();
      } catch (err) {
        console.error('Error deleting subject:', err);
        alert('Lỗi khi xóa môn học.');
      }
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-emerald-500" /> Quản Lý Môn Học
          </h1>
          <p className="text-gray-500 mt-1">Tổng cộng {subjects.length} môn học • {subjects.reduce((s, sub) => s + sub.credits, 0)} tín chỉ</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 font-medium"
        >
          <BookPlus className="w-4 h-4" /> Thêm Môn Học
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Tìm kiếm theo tên, mã môn học..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
          />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none bg-white min-w-[160px]">
          <option value="">Tất cả khoa</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none bg-white min-w-[140px]">
          <option value="">Tất cả HK</option>
          {semesters.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={resetForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">{editingId ? '✏️ Sửa Môn Học' : '➕ Thêm Môn Học Mới'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã môn học *</label>
                  <input type="text" value={form.subjectId}
                    onChange={e => setForm({ ...form, subjectId: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${errors.subjectId ? 'border-red-500' : 'border-gray-200'} focus:border-emerald-500 outline-none`}
                    placeholder="VD: MH001"
                  />
                  {errors.subjectId && <p className="text-red-500 text-xs mt-1">{errors.subjectId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tín chỉ *</label>
                  <input type="number" value={form.credits} min={1} max={10}
                    onChange={e => setForm({ ...form, credits: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded-lg border ${errors.credits ? 'border-red-500' : 'border-gray-200'} focus:border-emerald-500 outline-none`}
                  />
                  {errors.credits && <p className="text-red-500 text-xs mt-1">{errors.credits}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên môn học *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:border-emerald-500 outline-none`}
                  placeholder="VD: Lập trình C++"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khoa/Bộ môn</label>
                  <input type="text" value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none"
                    placeholder="VD: CNTT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ</label>
                  <input type="text" value={form.semester}
                    onChange={e => setForm({ ...form, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none"
                    placeholder="VD: HK1-2024"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
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
                <th className="px-4 py-3 font-semibold">Mã MH</th>
                <th className="px-4 py-3 font-semibold">Tên môn học</th>
                <th className="px-4 py-3 font-semibold text-center">Tín chỉ</th>
                <th className="px-4 py-3 font-semibold">Khoa/Bộ môn</th>
                <th className="px-4 py-3 font-semibold">Học kỳ</th>
                <th className="px-4 py-3 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((subject, index) => (
                <tr key={subject.id} className="border-t hover:bg-emerald-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-emerald-600">{subject.subjectId}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{subject.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">{subject.credits}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{subject.department || '-'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-medium">{subject.semester || '-'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(subject)} className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600" title="Sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(subject)} className="p-2 hover:bg-red-100 rounded-lg text-red-600" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  {search || filterDept || filterSemester ? 'Không tìm thấy môn học phù hợp' : 'Chưa có môn học nào'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
