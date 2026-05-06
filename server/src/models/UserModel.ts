import mongoose, { Schema } from 'mongoose';
import type { Role } from '../types.js';

export type UserDoc = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role | string;
  studentId?: string | null;
  course?: string | null;
  department?: string | null;
  profilePicture?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, index: true },
    studentId: { type: String, required: false, unique: true, sparse: true, index: true },
    course: { type: String, required: false },
    department: { type: String, required: false },
    profilePicture: { type: String, required: false }
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id?.toString?.() ?? ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const UserModel =
  mongoose.models.User || mongoose.model<UserDoc>('User', UserSchema);

