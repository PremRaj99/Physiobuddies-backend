import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
import { logActivity } from '@/modules/log/activity/activity.service';
import { formatComplaintRecord, getTimestampFromObjectId } from './complaint.helper';
import { CreateComplaintDTO } from './complaint.type';

class ComplaintService {
  async getUserComplaints(userId: string, isAdmin = false) {
    const where = isAdmin ? {} : { userId };
    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        reply: { orderBy: { id: 'asc' } },
        user: { select: { name: true, email: true } },
      },
    });

    return complaints.map(formatComplaintRecord);
  }

  async createComplaint(userId: string, data: CreateComplaintDTO) {
    const complaint = await prisma.complaint.create({
      data: {
        userId,
        type: data.type,
        description: data.description,
        status: 'pending',
        reply: {
          create: {
            role: 'user',
            message: data.description,
          },
        },
      },
      include: {
        reply: true,
      },
    });

    await logActivity({
      userId,
      title: 'Complaint Created',
      type: 'frequent',
      data: `Complaint ID: ${complaint.id}, Type: ${data.type}`,
    });

    return formatComplaintRecord(complaint);
  }

  async addReply(
    userId: string,
    complaintId: string,
    message: string,
    role: 'user' | 'support' = 'user',
  ) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    const isAdmin = role === 'support';
    if (!isAdmin && complaint.userId !== userId) {
      throw new NotFoundError('Complaint not found');
    }

    const reply = await prisma.reply.create({
      data: {
        complaintId,
        role,
        message,
      },
    });

    if (isAdmin && complaint.status === 'pending') {
      await prisma.complaint.update({
        where: { id: complaintId },
        data: { status: 'processing' },
      });
    }

    await logActivity({
      userId,
      title: 'Complaint Reply Added',
      type: 'frequent',
      data: `Complaint ID: ${complaintId}`,
    });

    return {
      id: reply.id,
      role: reply.role,
      message: reply.message,
      createdAt: (reply as { createdAt?: Date }).createdAt || getTimestampFromObjectId(reply.id),
    };
  }

  async updateStatus(
    complaintId: string,
    status: 'pending' | 'processing' | 'completed' | 'rejected',
  ) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: { status },
      include: {
        reply: { orderBy: { id: 'asc' } },
        user: { select: { name: true, email: true } },
      },
    });

    return formatComplaintRecord(updated);
  }
}

export const complaintService = new ComplaintService();
