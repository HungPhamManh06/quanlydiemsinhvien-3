import { useState, useMemo } from 'react';
import { Student } from '../types';
import * as api from '../api';
import { Plus, Search, Edit2, Trash2, X, UserPlus, Users, Loader2 } from 'lucide-react';

interface Props {
  students: Student[];
  onRefresh: () => Promise<void>;
}

const emptyForm: {
  studentId: string; name: string; className: string; email: string; phone: string;
  dateOfBirth: string; gender: 'Nam' | 'Nữ'; address: string;
} = {
  studentId: '', name: '', className: '', email: '', phone: '',
  dateOfBirth: '', gender: 'Nam', address: '',
};

export default function StudentManagement({ students, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const classes = useMemo(() => [...new Set(students.map(s => s.className))].sort(), [students]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchClass = !filterClass || s.className === filterClass;
      return matchSearch && matchClass;
    });
  }, [students, search, filterClass]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.studentId.trim()) errs.studentId = 'Mã SV không được để trống';
    if (!form.name.trim()) errs.name = 'Họ tên không được để trống';
    if (!form.className.trim()) errs.className = 'Lớp không được để trống';
    const existing = students.find(s => s.studentId === form.studentId && s.id !== editingId);
    if (existing) errs.studentId = 'Mã SV đã tồn tại';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.updateStudent(editingId, form);
      } else {
        await api.addStudent(form);
      }
      await onRefresh();
      resetForm();
    } catch (err) {
      console.error('Error saving student:', err);
      alert('Lỗi khi lưu sinh viên. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (student: Student) => {
    setForm({
      studentId: student.studentId,
      name: student.name,
      className: student.className,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      address: student.address,
    });
    setEditingId(student.id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (student: Student) => {
    if (confirm(`Bạn có chắc muốn xóa sinh viên "${student.name}" (${student.studentId})?\nTất cả điểm của sinh viên này cũng sẽ bị xóa.`)) {
      try {
        await api.deleteStudent(student.id);
        await onRefresh();
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('Lỗi khi xóa sinh viên.');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-500" /> Quản Lý Sinh Viên
          </h1>
          <p className="text-gray-500 mt-1">Tổng cộng {students.length} sinh viên</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 font-medium"
        >
          <UserPlus className="w-4 h-4" /> Thêm Sinh Viên
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã SV, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white min-w-[160px]"
        >
          <option value="">Tất cả lớp</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={resetForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? '✏️ Sửa Sinh Viên' : '➕ Thêm Sinh Viên Mới'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã sinh viên *</label>
                  <input
                    type="text" value={form.studentId}
                    onChange={e => setForm({ ...form, studentId: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${errors.studentId ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none`}
                    placeholder="VD: SV001"
                  />
                  {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                  <input
                    type="text" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none`}
                    placeholder="VD: Nguyễn Văn A"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lớp *</label>
                  <input
                    type="text" value={form.className}
                    onChange={e => setForm({ ...form, className: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${errors.className ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none`}
                    placeholder="VD: CNTT-K20A"
                  />
                  {errors.className && <p className="text-red-500 text-xs mt-1">{errors.className}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value as 'Nam' | 'Nữ' })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date" value={form.dateOfBirth}
                    onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="VD: email@university.edu.vn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="VD: 0901234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <input
                    type="text" value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="VD: Hà Nội"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50">
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
                <th className="px-4 py-3 font-semibold">Mã SV</th>
                <th className="px-4 py-3 font-semibold">Họ và tên</th>
                <th className="px-4 py-3 font-semibold">Lớp</th>
                <th className="px-4 py-3 font-semibold">Giới tính</th>
                <th className="px-4 py-3 font-semibold">Ngày sinh</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">SĐT</th>
                <th className="px-4 py-3 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student, index) => (
                <tr key={student.id} className="border-t hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-blue-600">{student.studentId}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">{student.className}</span></td>
                  <td className="px-4 py-3">{student.gender}</td>
                  <td className="px-4 py-3 text-gray-600">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{student.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{student.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(student)} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors" title="Sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(student)} className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    {search || filterClass ? 'Không tìm thấy sinh viên phù hợp' : 'Chưa có sinh viên nào. Hãy thêm mới!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
