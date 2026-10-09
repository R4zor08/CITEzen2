export type Role = 'student' | 'staff' | 'admin';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ConcernAttachment = {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  field?: string;
};

export type AuthUser = {
  id: string;
  role: Role;
  email: string;
  name: string;
  studentId?: string;
};

export type AIClassification = {
  concernCategory: 'Academic' | 'Administrative' | 'Facility' | 'Complaints' | string;
  category?: 'Academic' | 'Administrative' | 'Facility' | 'Complaints' | string;
  department: string;
  priority: Priority;
  concernSummary: string;
  reasoning: string;
  confidence: number;
  suggestedStaffId?: string | null;
  suggestedStaffName?: string | null;
  subcategory?: string;
};

