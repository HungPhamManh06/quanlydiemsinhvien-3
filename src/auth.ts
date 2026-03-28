import { User, UserRole } from './types';

const USERS_KEY = 'grade_mgmt_users';
const AUTH_KEY = 'grade_mgmt_auth';

export interface StoredUser {
  id: string;
  username: string;
  password: string; // In production, use bcrypt hash
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

// Default admin accounts
const defaultUsers: StoredUser[] = [
  {
    id: 'user_admin',
    username: 'admin',
    password: 'admin123',
    fullName: 'Quản Trị Viên',
    email: 'admin@university.edu.vn',
    role: 'admin',
    department: 'Phòng Đào Tạo',
    phone: '0123456789',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_teacher1',
    username: 'giangvien',
    password: 'gv123456',
    fullName: 'Nguyễn Văn An',
    email: 'nva@university.edu.vn',
    role: 'teacher',
    department: 'Khoa Công Nghệ Thông Tin',
    phone: '0987654321',
    createdAt: new Date().toISOString(),
  },
];

function getStoredUsers(): StoredUser[] {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(data);
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function generateId(): string {
  return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function generateToken(): string {
  return 'token_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 16);
}

export function toPublicUser(stored: StoredUser): User {
  return {
    id: stored.id,
    username: stored.username,
    fullName: stored.fullName,
    email: stored.email,
    role: stored.role,
    department: stored.department,
    phone: stored.phone,
    avatar: stored.avatar,
    createdAt: stored.createdAt,
    lastLogin: stored.lastLogin,
  };
}

export interface LoginResult {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface RegisterResult {
  success: boolean;
  message: string;
}

export function login(username: string, password: string): LoginResult {
  const users = getStoredUsers();
  const user = users.find(
    u => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    return { success: false, message: 'Tài khoản không tồn tại!' };
  }

  if (user.password !== password) {
    return { success: false, message: 'Mật khẩu không đúng!' };
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  saveUsers(users);

  const token = generateToken();
  const publicUser = toPublicUser(user);

  // Save auth state
  localStorage.setItem(AUTH_KEY, JSON.stringify({ user: publicUser, token }));

  return { success: true, message: 'Đăng nhập thành công!', user: publicUser, token };
}

export function register(data: {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
}): RegisterResult {
  const users = getStoredUsers();

  // Check if username exists
  if (users.some(u => u.username.toLowerCase() === data.username.toLowerCase())) {
    return { success: false, message: 'Tên đăng nhập đã tồn tại!' };
  }

  // Check if email exists
  if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
    return { success: false, message: 'Email đã được sử dụng!' };
  }

  // Validate
  if (data.username.length < 3) {
    return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' };
  }
  if (data.password.length < 6) {
    return { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự!' };
  }

  const newUser: StoredUser = {
    id: generateId(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return { success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.' };
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function getAuthState(): { user: User | null; token: string | null } {
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return { user: null, token: null };
  try {
    return JSON.parse(data);
  } catch {
    return { user: null, token: null };
  }
}

export function isAuthenticated(): boolean {
  const { user, token } = getAuthState();
  return !!(user && token);
}

export function changePassword(userId: string, oldPassword: string, newPassword: string): { success: boolean; message: string } {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Người dùng không tồn tại!' };
  if (user.password !== oldPassword) return { success: false, message: 'Mật khẩu cũ không đúng!' };
  if (newPassword.length < 6) return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' };

  user.password = newPassword;
  saveUsers(users);
  return { success: true, message: 'Đổi mật khẩu thành công!' };
}

export function updateProfile(userId: string, data: Partial<Pick<StoredUser, 'fullName' | 'email' | 'phone' | 'department'>>): { success: boolean; message: string; user?: User } {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Người dùng không tồn tại!' };

  if (data.fullName) user.fullName = data.fullName;
  if (data.email) user.email = data.email;
  if (data.phone) user.phone = data.phone;
  if (data.department) user.department = data.department;

  saveUsers(users);

  const publicUser = toPublicUser(user);
  // Update auth state
  const auth = getAuthState();
  if (auth.token) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ user: publicUser, token: auth.token }));
  }

  return { success: true, message: 'Cập nhật hồ sơ thành công!', user: publicUser };
}

export function resetPassword(email: string): { success: boolean; message: string } {
  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { success: false, message: 'Email không tồn tại trong hệ thống!' };

  // In a real app, send email. Here we reset to default
  user.password = '123456';
  saveUsers(users);
  return { success: true, message: 'Mật khẩu đã được đặt lại thành "123456". Vui lòng đăng nhập và đổi mật khẩu mới.' };
}

export function getAllUsers(): User[] {
  return getStoredUsers().map(toPublicUser);
}

export function deleteUser(userId: string): { success: boolean; message: string } {
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false, message: 'Không tìm thấy người dùng!' };
  if (users[idx].username === 'admin') return { success: false, message: 'Không thể xóa tài khoản admin chính!' };
  users.splice(idx, 1);
  saveUsers(users);
  return { success: true, message: 'Đã xóa người dùng!' };
}
