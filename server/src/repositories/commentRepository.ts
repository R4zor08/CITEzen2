import { CommentModel } from '../models/CommentModel.js';

export async function createComment(data: {
  concernId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  visibleTo: string;
}) {
  return CommentModel.create(data);
}

