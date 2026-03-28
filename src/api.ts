import { Student, Subject, Grade } from './types';
import * as localData from './data';

// API base URL - relative for production (same origin), configurable for dev
const API_BASE = '/api';

// Track if API is available
let apiAvailable: boolean | null = null;

async function checkApi(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  try {
    const res = await fetch(`${API_BASE}/students`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    apiAvailable = res.ok;
  } catch {
    apiAvailable = false;
  }
  return apiAvailable;
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ============ STUDENTS ============

export async function getStudents(): Promise<Student[]> {
  const isApi = await checkApi();
  if (isApi) {
    return apiCall<Student[]>('/students');
  }
  return localData.getStudents();
}

export async function addStudent(student: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  const isApi = await checkApi();
  if (isApi) {
    return apiCall<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  }
  return localData.addStudent(student);
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student | null> {
  const isApi = await checkApi();
  if (isApi) {
    return apiCall<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  return localData.updateStudent(id, data);
}

export async function deleteStudent(id: string): Promise<boolean> {
  const isApi = await checkApi();
  if (isApi) {
    await apiCall(`/students/${id}`, { method: 'DELETE' });
    return true;
  }
  return localData.deleteStudent(id);
}

// ============ SUBJECTS ============

export async function getSubjects(): Promise<Subject[]> {
  const isApi = await checkApi();
  if (isApi) {
    return apiCall<Subject[]>('/subjects');
  }
  return localData.getSubjects();
}

export async function addSubject(subject: Omit<Subject, 'id' | 'createdAt'>): Promise<Subject> {
  const isApi = await checkApi();
  if (isApi) {
    return apiCall<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(subject),
    });
  }
  return localData.addSubject(subject);
}

export async function updateSubject(id: string, data: Partial<Subject>): Promise<Subject | null> {
  const isApi = await checkApi();
  if (isApi) {
    return apiCall<Subject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  return localData.updateSubject(id, data);
}

export async function deleteSubject(id: string): Promise<boolean> {
  const isApi = await checkApi();
  if (isApi) {
    await apiCall(`/subjects/${id}`, { method: 'DELETE' });
    return true;
  }
  return localData.deleteSubject(id);
}

// ============ GRADES ============

export async function getGrades(): Promise<Grade[]> {
  const isApi = await checkApi();
  if (isApi) {
    return apiCall<Grade[]>('/grades');
  }
  return localData.getGrades();
}

export async function addGrade(grade: Omit<Grade, 'id' | 'createdAt' | 'averageScore' | 'letterGrade'>): Promise<Grade> {
  const isApi = await checkApi();
  if (isApi) {
    return apiCall<Grade>('/grades', {
      method: 'POST',
      body: JSON.stringify(grade),
    });
  }
  return localData.addGrade(grade);
}

export async function updateGrade(id: string, data: Partial<Grade>): Promise<Grade | null> {
  const isApi = await checkApi();
  if (isApi) {
    return apiCall<Grade>(`/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  return localData.updateGrade(id, data);
}

export async function deleteGrade(id: string): Promise<boolean> {
  const isApi = await checkApi();
  if (isApi) {
    await apiCall(`/grades/${id}`, { method: 'DELETE' });
    return true;
  }
  return localData.deleteGrade(id);
}

// ============ SEED DATA ============

export async function seedData(): Promise<void> {
  const isApi = await checkApi();
  if (isApi) {
    await apiCall('/seed', { method: 'POST' });
  } else {
    localStorage.clear();
    localData.initSampleData();
  }
}

// ============ STATUS ============

export function isApiMode(): boolean {
  return apiAvailable === true;
}

export function resetApiCheck(): void {
  apiAvailable = null;
}
