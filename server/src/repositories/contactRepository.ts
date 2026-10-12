import { ContactMessageModel } from '../models/ContactMessageModel.js';

export async function createContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return ContactMessageModel.create(data);
}

export async function listContactMessages() {
  return ContactMessageModel.find().sort({ createdAt: -1 }).exec();
}

export async function markContactMessageRead(id: string) {
  return ContactMessageModel.findByIdAndUpdate(
    id,
    { $set: { status: 'read' } },
    { new: true }
  ).exec();
}
