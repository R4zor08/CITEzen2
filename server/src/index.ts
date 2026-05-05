import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma.js';
import {
  commentToApi,
  concernToApi,
  notificationToApi,
  statusFromApi,
  userToApi
} from './mappers.js';
import type { Prisma } from '@prisma/client';

type Role = 'student' | 'staff' | 'admin';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

/** Comma-separated origins in CORS_ORIGIN, or omit / leave empty to allow any origin (dev default). */
function corsOriginOption(): boolean | string | string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) return true;
  const list = raw.split(',').map((o) => o.trim()).filter(Boolean);
  if (list.length === 0) return true;
  if (list.length === 1) return list[0];
  return list;
}

app.use(cors({ origin: corsOriginOption() }));
// Default 100kb is too small for profile avatars stored as base64 data URLs
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? '15mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'citezen-api' });
});

/** Login: students use Student ID; staff/admin use email */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body as {
      identifier?: string;
      password?: string;
      role?: Role;
    };
    if (!identifier || !password || !role) {
      res.status(400).json({ error: 'identifier, password, and role are required' });
      return;
    }

    const user =
      role === 'student'
        ? await prisma.user.findFirst({ where: { studentId: identifier, role: 'student' } })
        : await prisma.user.findFirst({ where: { email: identifier, role } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({
        error: 'Invalid credentials. Please check your Student ID/Email and password.'
      });
      return;
    }

    res.json({ user: userToApi(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const body = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
      studentId?: string;
      course?: string;
      department?: string;
    };

    const { name, password, role, studentId, course, department } = body;
    let { email } = body;

    if (!name || !password || !role) {
      res.status(400).json({ error: 'name, password, and role are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (role === 'student') {
      if (!studentId) {
        res.status(400).json({ error: 'Student ID is required for student accounts.' });
        return;
      }
      const dup = await prisma.user.findFirst({ where: { studentId } });
      if (dup) {
        res.status(400).json({ error: 'An account with this Student ID already exists.' });
        return;
      }
      email = email?.trim() || `${studentId.toLowerCase().replace(/\s+/g, '')}@student.local`;
    } else {
      if (!email?.trim()) {
        res.status(400).json({ error: 'Email is required.' });
        return;
      }
      email = email.trim();
      const dup = await prisma.user.findFirst({ where: { email } });
      if (dup) {
        res.status(400).json({ error: 'An account with this email already exists.' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: email!,
        passwordHash,
        role,
        studentId: role === 'student' ? studentId : null,
        course: course ?? null,
        department: department ?? null
      }
    });

    res.status(201).json({ ok: true, userId: user.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/api/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(users.map(userToApi));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body as Partial<{
      name: string;
      email: string;
      department: string;
      course: string;
      profilePicture: string;
      role: string;
      studentId: string | null;
      password: string;
    }>;

    const data: Prisma.UserUpdateInput = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.email !== undefined) data.email = updates.email;
    if (updates.department !== undefined) data.department = updates.department;
    if (updates.course !== undefined) data.course = updates.course;
    if (updates.profilePicture !== undefined) {
      data.profilePicture = updates.profilePicture;
    }
    if (updates.role !== undefined) {
      data.role = updates.role;
      if (updates.role !== 'student') {
        data.studentId = null;
      }
    }
    if (updates.studentId !== undefined) {
      data.studentId =
        updates.studentId && String(updates.studentId).trim()
          ? String(updates.studentId).trim()
          : null;
    }
    if (updates.password && updates.password.length >= 6) {
      data.passwordHash = await bcrypt.hash(updates.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data
    });
    res.json(userToApi(user));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.get('/api/concerns', async (req, res) => {
  try {
    const { studentId, department, assignedToId, status } = req.query;
    const where: Prisma.ConcernWhereInput = {};

    if (typeof studentId === 'string') where.studentId = studentId;
    if (typeof department === 'string') where.department = department;
    if (typeof assignedToId === 'string') where.assignedToId = assignedToId;
    if (typeof status === 'string') where.status = statusFromApi(status);

    const list = await prisma.concern.findMany({
      where,
      include: { comments: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(list.map(concernToApi));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list concerns' });
  }
});

app.get('/api/concerns/:id', async (req, res) => {
  try {
    const c = await prisma.concern.findUnique({
      where: { id: req.params.id },
      include: { comments: { orderBy: { createdAt: 'asc' } } }
    });
    if (!c) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(concernToApi(c));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load concern' });
  }
});

app.post('/api/concerns', async (req, res) => {
  try {
    const b = req.body as {
      title?: string;
      description?: string;
      category?: string;
      subcategory?: string;
      priority?: Priority;
      studentId?: string;
      studentName?: string;
      department?: string;
      formData?: Record<string, unknown>;
      attachments?: string[];
    };

    if (!b.studentId || !b.studentName) {
      res.status(400).json({ error: 'studentId and studentName are required' });
      return;
    }

    const student = await prisma.user.findUnique({ where: { id: b.studentId } });
    if (!student) {
      res.status(400).json({ error: 'Student user not found' });
      return;
    }

    const c = await prisma.concern.create({
      data: {
        title: b.title ?? 'Untitled Concern',
        description: b.description ?? '',
        category: b.category ?? 'General',
        subcategory: b.subcategory ?? 'General',
        priority: b.priority ?? 'medium',
        studentId: b.studentId,
        studentName: b.studentName,
        department: b.department ?? 'Administration',
        formData: b.formData !== undefined ? JSON.stringify(b.formData) : null,
        attachments: b.attachments !== undefined ? JSON.stringify(b.attachments) : null
      },
      include: { comments: true }
    });

    await prisma.notification.create({
      data: {
        userId: b.studentId,
        title: 'Concern Submitted',
        message: `Your concern "${c.title}" has been routed to ${c.department}.`,
        type: 'system',
        concernId: c.id
      }
    });

    res.status(201).json(concernToApi(c));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create concern' });
  }
});

app.patch('/api/concerns/:id', async (req, res) => {
  try {
    const b = req.body as Partial<{
      status: string;
      priority: Priority;
      assignedTo: string | null;
      department: string;
    }>;

    const prev = await prisma.concern.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true, studentId: true, assignedToId: true }
    });
    if (!prev) {
      res.status(404).json({ error: 'Concern not found' });
      return;
    }

    const data: Record<string, unknown> = {};
    if (b.status !== undefined) data.status = statusFromApi(b.status);
    if (b.priority !== undefined) data.priority = b.priority;
    if (b.department !== undefined) data.department = b.department;
    if (b.assignedTo !== undefined) data.assignedToId = b.assignedTo;

    const c = await prisma.concern.update({
      where: { id: req.params.id },
      data,
      include: { comments: { orderBy: { createdAt: 'asc' } } }
    });

    if (b.status !== undefined) {
      await prisma.notification.create({
        data: {
          userId: c.studentId,
          title: 'Status Updated',
          message: `Your concern "${c.title}" is now ${b.status.replace(/-/g, ' ')}.`,
          type: 'status_change',
          concernId: c.id
        }
      });
    }

    if (b.assignedTo !== undefined && b.assignedTo !== prev.assignedToId) {
      if (b.assignedTo) {
        await prisma.notification.create({
          data: {
            userId: b.assignedTo,
            title: 'New Assignment',
            message: `You have been assigned "${c.title}".`,
            type: 'assignment',
            concernId: c.id
          }
        });
      }
    }

    res.json(concernToApi(c));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update concern' });
  }
});

app.post('/api/concerns/:id/comments', async (req, res) => {
  try {
    const { content, authorId, visibleTo } = req.body as {
      content?: string;
      authorId?: string;
      visibleTo?: Role[];
    };

    if (!content?.trim() || !authorId) {
      res.status(400).json({ error: 'content and authorId are required' });
      return;
    }

    const author = await prisma.user.findUnique({ where: { id: authorId } });
    if (!author) {
      res.status(400).json({ error: 'Author not found' });
      return;
    }

    const concern = await prisma.concern.findUnique({ where: { id: req.params.id } });
    if (!concern) {
      res.status(404).json({ error: 'Concern not found' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        concernId: concern.id,
        authorId: author.id,
        authorName: author.name,
        authorRole: author.role,
        content: content.trim(),
        visibleTo: JSON.stringify(visibleTo ?? ['student', 'staff', 'admin'])
      }
    });

    const notifyUserId =
      author.role === 'student' ? concern.assignedToId ?? undefined : concern.studentId;
    if (notifyUserId) {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          title: 'New Comment',
          message: `${author.name} commented on "${concern.title}".`,
          type: 'comment',
          concernId: concern.id
        }
      });
    }

    res.status(201).json(commentToApi(comment));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.post('/api/concerns/:id/forward', async (req, res) => {
  try {
    const { department } = req.body as { department?: string };
    if (!department?.trim()) {
      res.status(400).json({ error: 'department is required' });
      return;
    }

    const c = await prisma.concern.update({
      where: { id: req.params.id },
      data: {
        department: department.trim(),
        assignedToId: null
      },
      include: { comments: { orderBy: { createdAt: 'asc' } } }
    });

    await prisma.notification.create({
      data: {
        userId: c.studentId,
        title: 'Concern Forwarded',
        message: `Your concern has been forwarded to ${c.department}.`,
        type: 'system',
        concernId: c.id
      }
    });

    res.json(concernToApi(c));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to forward concern' });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (typeof userId !== 'string') {
      res.status(400).json({ error: 'userId query param is required' });
      return;
    }

    const list = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(list.map(notificationToApi));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list notifications' });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const n = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true }
    });
    res.json(notificationToApi(n));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.post('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

app.delete('/api/notifications', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (typeof userId !== 'string' || !userId) {
      res.status(400).json({ error: 'userId query param is required' });
      return;
    }
    const r = await prisma.notification.deleteMany({ where: { userId } });
    res.json({ ok: true, count: r.count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

app.listen(PORT, () => {
  console.log(`citezen API listening on http://localhost:${PORT}`);
});
