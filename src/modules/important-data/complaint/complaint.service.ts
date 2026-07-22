import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';
import { CreateComplaintDTO } from './complaint.type';

function getTimestampFromObjectId(id: string): Date {
  try {
    const timestamp = parseInt(id.substring(0, 8), 16) * 1000;
    return new Date(timestamp);
  } catch {
    return new Date();
  }
}

class ComplaintService {
  async getUserComplaints(userId: string) {
    const complaints = await prisma.complaint.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      include: {
        reply: { orderBy: { id: 'asc' } },
      },
    });

    return complaints.map((complaint) => ({
      id: complaint.id,
      type: complaint.type,
      description: complaint.description,
      status: complaint.status,
      createdAt:
        (complaint as { createdAt?: Date }).createdAt || getTimestampFromObjectId(complaint.id),
      reply: complaint.reply.map((r) => ({
        id: r.id,
        role: r.role,
        message: r.message,
        createdAt: (r as { createdAt?: Date }).createdAt || getTimestampFromObjectId(r.id),
      })),
    }));
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

    return {
      id: complaint.id,
      type: complaint.type,
      description: complaint.description,
      status: complaint.status,
      createdAt:
        (complaint as { createdAt?: Date }).createdAt || getTimestampFromObjectId(complaint.id),
      reply: complaint.reply.map((r) => ({
        id: r.id,
        role: r.role,
        message: r.message,
        createdAt: (r as { createdAt?: Date }).createdAt || getTimestampFromObjectId(r.id),
      })),
    };
  }

  async addReply(userId: string, complaintId: string, message: string) {
    const complaint = await prisma.complaint.findFirst({
      where: { id: complaintId, userId },
    });

    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    const reply = await prisma.reply.create({
      data: {
        complaintId,
        role: 'user',
        message,
      },
    });

    return {
      id: reply.id,
      role: reply.role,
      message: reply.message,
      createdAt: (reply as { createdAt?: Date }).createdAt || getTimestampFromObjectId(reply.id),
    };
  }
}

export const complaintService = new ComplaintService();
