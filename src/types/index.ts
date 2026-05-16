export type Role = 'student' | 'staff' | 'admin';
export type ConcernStatus = 'pending' | 'in-progress' | 'resolved' | 'rejected';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationType =
'status_change' |
'comment' |
'assignment' |
'system';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string;
  course?: string;
  department?: string;
  profilePicture?: string;
  /** Present when user is loaded from the API */
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  visibleTo: Role[];
  author: string;
  authorRole: Role;
  content: string;
  createdAt: string;
}

export interface ConcernAttachment {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  field?: string;
}

export interface Concern {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  status: ConcernStatus;
  priority: Priority;
  studentId: string;
  studentName: string;
  assignedTo?: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  attachments?: ConcernAttachment[];
  comments: Comment[];
  formData?: Record<string, any>;
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'file' | 'date';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Template {
  id: string;
  category: string;
  subcategory: string;
  title: string;
  description: string;
  fields: TemplateField[];
  routeTo: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: NotificationType;
  concernId?: string;
}