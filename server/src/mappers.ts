import type { ConcernAttachment, Role } from './types.js';

function parseJson<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function statusToApi(s: string): 'pending' | 'in-progress' | 'resolved' | 'rejected' {
  if (s === 'in_progress') return 'in-progress';
  if (s === 'pending' || s === 'resolved' || s === 'rejected') return s;
  return 'pending';
}

export function statusFromApi(s: string): string {
  if (s === 'in-progress') return 'in_progress';
  return s;
}

export function userToApi(u: { passwordHash?: unknown } & Record<string, unknown>) {
  const anyU = u as any;
  const base =
    typeof anyU?.toObject === 'function'
      ? anyU.toObject()
      : (anyU?._doc ?? anyU);

  const id = base.id ?? (base._id ? String(base._id) : undefined);
  const { passwordHash: _passwordHash, _id: _internalId, __v: _version, ...rest } = base;

  return { ...rest, ...(id ? { id } : {}) };
}

type CommentLike = {
  id: string;
  authorName: string;
  authorRole: Role | string;
  content: string;
  createdAt: Date;
  visibleTo: string | null;
};

function inferMimeFromDataUrl(dataUrl: string): string {
  const match = /^data:([^;]+);/.exec(dataUrl);
  return match?.[1] ?? 'application/octet-stream';
}

function normalizeAttachment(item: unknown): ConcernAttachment | null {
  if (item == null) return null;

  if (typeof item === 'object') {
    const o = item as Record<string, unknown>;
    if (typeof o.dataUrl === 'string') {
      return {
        name: typeof o.name === 'string' ? o.name : 'Attachment',
        mimeType:
          typeof o.mimeType === 'string' ? o.mimeType : inferMimeFromDataUrl(o.dataUrl),
        size: typeof o.size === 'number' ? o.size : 0,
        dataUrl: o.dataUrl,
        field: typeof o.field === 'string' ? o.field : undefined
      };
    }
  }

  if (typeof item === 'string') {
    if (item.startsWith('data:')) {
      return {
        name: 'Attachment',
        mimeType: inferMimeFromDataUrl(item),
        size: 0,
        dataUrl: item
      };
    }
    try {
      return normalizeAttachment(JSON.parse(item));
    } catch {
      return null;
    }
  }

  return null;
}

function parseAttachments(raw: string | null): ConcernAttachment[] | undefined {
  const parsed = parseJson<unknown[]>(raw, []);
  if (!Array.isArray(parsed) || parsed.length === 0) return undefined;
  const normalized = parsed
    .map(normalizeAttachment)
    .filter((a): a is ConcernAttachment => a != null);
  return normalized.length > 0 ? normalized : undefined;
}

export function commentToApi(c: CommentLike) {
  const anyC = c as any;
  const id = anyC.id ?? (anyC._id ? String(anyC._id) : c.id);
  return {
    id,
    author: c.authorName,
    authorRole: c.authorRole as Role,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    visibleTo: parseJson<Role[]>(c.visibleTo, ['student', 'staff', 'admin'])
  };
}

type ConcernLike = {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  status: string;
  priority: string;
  studentId: string;
  studentName: string;
  assignedToId?: string | null;
  department: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: string | null;
  formData?: string | null;
  comments: CommentLike[];
};

export function concernToApi(c: ConcernLike) {
  const anyC = c as any;
  const id = anyC.id ?? (anyC._id ? String(anyC._id) : c.id);
  return {
    id,
    title: c.title,
    description: c.description,
    category: c.category,
    subcategory: c.subcategory,
    status: statusToApi(c.status),
    priority: c.priority as 'low' | 'medium' | 'high' | 'urgent',
    studentId: c.studentId,
    studentName: c.studentName,
    assignedTo: c.assignedToId ?? undefined,
    department: c.department,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    attachments: parseAttachments(c.attachments ?? null),
    formData: parseJson<Record<string, unknown> | undefined>(c.formData ?? null, undefined),
    comments: c.comments.map(commentToApi)
  };
}

type NotificationLike = {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  type: string;
  concernId?: string | null;
};

export function notificationToApi(n: NotificationLike) {
  const anyN = n as any;
  const id = anyN.id ?? (anyN._id ? String(anyN._id) : n.id);
  return {
    id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    type: n.type,
    concernId: n.concernId ?? undefined
  };
}
