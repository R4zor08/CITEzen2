export type Role = 'student' | 'staff' | 'admin';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type AuthUser = {
  id: string;
  role: Role;
  email: string;
  name: string;
  studentId?: string;
};

