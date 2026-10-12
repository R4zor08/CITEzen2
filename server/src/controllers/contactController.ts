import type { Request, Response } from 'express';
import { z } from 'zod';
import * as contactRepo from '../repositories/contactRepository.js';
import * as userRepo from '../repositories/userRepository.js';
import * as notificationRepo from '../repositories/notificationRepository.js';
import { sendContactInquiryEmail } from '../services/emailService.js';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('A valid email address is required'),
  subject: z.string().trim().min(2, 'Subject is required'),
  message: z.string().trim().min(5, 'Message must be at least 5 characters')
});

export async function submitContact(req: Request, res: Response) {
  try {
    const parseResult = contactSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid contact form data'
      });
      return;
    }

    const { name, email, subject, message } = parseResult.data;

    // 1. Save contact message to MongoDB
    const record = await contactRepo.createContactMessage({
      name,
      email,
      subject,
      message
    });

    // 2. Notify all admins
    try {
      const admins = await userRepo.findUsersByRole('admin');
      const snippet = message.length > 80 ? message.slice(0, 80) + '...' : message;
      for (const admin of admins) {
        await notificationRepo.createNotification({
          userId: admin._id ? admin._id.toString() : admin.id,
          title: `New Public Inquiry from ${name}`,
          message: `Subject: "${subject}" | From: ${email}\n"${snippet}"`,
          type: 'system'
        });
      }
    } catch (notifErr) {
      console.warn('Could not dispatch admin notifications for contact message:', notifErr);
    }

    // 3. Dispatch real email notification to Gmail inbox (rcllanto@nemsu.edu.ph)
    try {
      await sendContactInquiryEmail({
        senderName: name,
        senderEmail: email,
        subject,
        message
      });
    } catch (mailErr) {
      console.warn('Could not dispatch email notification:', mailErr);
    }

    res.status(201).json({
      ok: true,
      message: 'Your inquiry has been submitted successfully.',
      id: record.id
    });
  } catch (err: any) {
    console.error('Contact submission error:', err);
    res.status(500).json({ error: 'Failed to process inquiry. Please try again.' });
  }
}

export async function getContactMessages(_req: Request, res: Response) {
  try {
    const messages = await contactRepo.listContactMessages();
    res.json(messages);
  } catch (err) {
    console.error('Error fetching contact messages:', err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
}

export async function markContactRead(req: Request, res: Response) {
  try {
    const updated = await contactRepo.markContactMessageRead(req.params.id);
    if (!updated) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error('Error updating contact message:', err);
    res.status(500).json({ error: 'Failed to update message' });
  }
}
