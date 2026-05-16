import { UserModel } from '../models/UserModel.js';
import type { Role } from '../types.js';

export async function findUserForLogin(args: { role: Role | 'student' | 'staff' | 'admin'; identifier: string }) {
  const { role, identifier } = args;
  // Login rules:
  // - students use Student ID
  // - staff/admin use email
  if (role === 'student') return UserModel.findOne({ studentId: identifier, role: 'student' });
  return UserModel.findOne({ email: identifier, role });
}

export async function findUserById(id: string) {
  return UserModel.findById(id);
}

export async function findUserByStudentId(studentId: string) {
  return UserModel.findOne({ studentId });
}

export async function findUserByEmail(email: string) {
  return UserModel.findOne({ email });
}

export async function listUsers() {
  return UserModel.find().sort({ createdAt: 1 });
}

export async function findUsersByRole(role: Role) {
  return UserModel.find({ role }).exec();
}

export async function findStaffByDepartment(department: string) {
  return UserModel.find({ role: 'staff', department }).exec();
}

export async function createUser(data: any) {
  return UserModel.create(data);
}

export async function updateUserById(id: string, data: any) {
  return UserModel.findByIdAndUpdate(id, data, { new: true });
}

