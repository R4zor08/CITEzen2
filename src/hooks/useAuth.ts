import { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { apiJson } from '../lib/api';

function normalizeStoredUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const anyRaw = raw as any;
  const base = anyRaw._doc && typeof anyRaw._doc === 'object' ? anyRaw._doc : anyRaw;
  const role = base.role as Role | undefined;
  if (!role || (role !== 'student' && role !== 'staff' && role !== 'admin')) return null;

  return {
    id: base.id ?? (base._id ? String(base._id) : ''),
    name: base.name ?? '',
    email: base.email ?? '',
    role,
    studentId: base.studentId ?? undefined,
    course: base.course ?? undefined,
    department: base.department ?? undefined,
    profilePicture: base.profilePicture ?? undefined,
    createdAt: base.createdAt ?? undefined,
    updatedAt: base.updatedAt ?? undefined
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('citezen_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(normalizeStoredUser(parsed));
      } catch {
        console.error('Failed to parse stored user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string, role: Role) => {
    const { user: u, token } = await apiJson<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role })
    });
    setUser(u);
    localStorage.setItem('citezen_user', JSON.stringify(u));
    localStorage.setItem('citezen_token', token);
    return u;
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const payload: Record<string, unknown> = {
      name: userData.name,
      password: userData.password,
      role: userData.role ?? 'student'
    };

    const email = userData.email?.trim();
    if (email) payload.email = email;

    const studentId = userData.studentId?.trim();
    if (studentId) payload.studentId = studentId;

    const course = userData.course?.trim();
    if (course) payload.course = course;

    const department = userData.department?.trim();
    if (department) payload.department = department;

    await apiJson<{ ok: boolean }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('citezen_user');
    localStorage.removeItem('citezen_token');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.department !== undefined) payload.department = updates.department;
    if (updates.course !== undefined) payload.course = updates.course;
    if (updates.profilePicture !== undefined) {
      payload.profilePicture = updates.profilePicture;
    }

    const updated = await apiJson<User>(`/api/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    setUser(updated);
    localStorage.setItem('citezen_user', JSON.stringify(updated));
    return updated;
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser
  };
}
