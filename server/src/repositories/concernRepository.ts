import { ConcernModel } from '../models/ConcernModel.js';
import { CommentModel } from '../models/CommentModel.js';

function docToPlain<T>(doc: any): T {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  // Ensure a stable `id` field for the rest of the codebase.
  const anyObj = obj as any;
  if (anyObj && anyObj.id === undefined && anyObj._id) {
    anyObj.id = String(anyObj._id);
  }
  return obj;
}

async function withComments(concernDoc: any) {
  const concern = docToPlain<any>(concernDoc);
  if (!concern) return concern;

  const concernId = String((concern as any).id ?? (concern as any)._id);
  const comments = await CommentModel.find({ concernId }).sort({ createdAt: 1 }).exec();

  return {
    ...concern,
    comments: comments.map((c) => docToPlain<any>(c))
  };
}

export async function listConcerns(where: any) {
  const rawConcerns = await ConcernModel.find(where)
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean()
    .exec();
  const plainConcerns = rawConcerns.map((c) => docToPlain<any>(c)).filter(Boolean);
  if (plainConcerns.length === 0) return [];

  const concernIds = plainConcerns.map((c) => String(c.id ?? c._id));
  const rawComments = await CommentModel.find({ concernId: { $in: concernIds } })
    .sort({ createdAt: 1 })
    .lean()
    .exec();

  const commentsByConcernId = new Map<string, any[]>();
  for (const c of rawComments) {
    const plainComment = docToPlain<any>(c);
    const list = commentsByConcernId.get(c.concernId) ?? [];
    list.push(plainComment);
    commentsByConcernId.set(c.concernId, list);
  }

  return plainConcerns.map((c) => ({
    ...c,
    comments: commentsByConcernId.get(String(c.id ?? c._id)) ?? []
  }));
}

export async function getConcernById(id: string) {
  const c = await ConcernModel.findById(id).exec();
  return withComments(c);
}

export async function getConcernLiteById(id: string) {
  const c = await ConcernModel.findById(id).select({ title: 1, studentId: 1, assignedToId: 1 }).exec();
  if (!c) return null;
  const concern = docToPlain<any>(c);
  return {
    id: concern.id ?? String(concern._id),
    title: concern.title,
    studentId: concern.studentId,
    assignedToId: concern.assignedToId ?? null
  };
}

export async function createConcern(data: any) {
  const c = await ConcernModel.create(data);
  const concern = docToPlain<any>(c);
  return { ...concern, comments: [] };
}

export async function updateConcernById(id: string, data: any) {
  const c = await ConcernModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  return withComments(c);
}

export async function getConcernRawById(id: string) {
  const c = await ConcernModel.findById(id).exec();
  return docToPlain<any>(c);
}

