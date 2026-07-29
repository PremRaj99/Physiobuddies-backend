import { getTimestampFromObjectId } from '@/shared/helper/mongo.helper';
export { getTimestampFromObjectId };

export interface ComplaintReplyRecord {
  id: string;
  role: string;
  message: string;
  createdAt?: Date;
}

export interface ComplaintRecordItem {
  id: string;
  userId: string;
  user?: { name: string | null; email: string | null } | null;
  type: string;
  description: string;
  status: string;
  createdAt?: Date;
  reply?: ComplaintReplyRecord[] | null;
}

/**
 * Formats complaint entity with mapped reply list and creation timestamps.
 */
export const formatComplaintRecord = (complaint: ComplaintRecordItem) => {
  return {
    id: complaint.id,
    userId: complaint.userId,
    user: complaint.user,
    type: complaint.type,
    description: complaint.description,
    status: complaint.status,
    createdAt: complaint.createdAt || getTimestampFromObjectId(complaint.id),
    reply: (complaint.reply || []).map((r) => ({
      id: r.id,
      role: r.role,
      message: r.message,
      createdAt: r.createdAt || getTimestampFromObjectId(r.id),
    })),
  };
};
