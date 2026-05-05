import { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { apiJson } from '../lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('citezen_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        console.error('Failed to parse stored user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string, role: Role) => {
    const { user: u } = await apiJson<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role })
    });
    setUser(u);
    localStorage.setItem('citezen_user', JSON.stringify(u));
    return u;
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    await apiJson<{ ok: boolean }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role ?? 'student',
        studentId: userData.studentId,
        course: userData.course,
        department: userData.department
      })
    });
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('citezen_user');
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
