import prisma from '@/config/prisma';
import { NotFoundError } from '@/core/errors/ApiError';

class ContactService {
  async submitContactForm(data: {
    name?: string;
    email: string;
    phone?: string;
    mobile?: string;
    message?: string;
    type?: string;
  }) {
    const contact = await prisma.contact.create({
      data: {
        email: data.email,
        mobile: data.mobile || data.phone || '',
        type: data.type || data.message || 'General Inquiry',
        status: 'pending',
      },
    });

    return contact;
  }

  async getAllContacts() {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return contacts.map((c) => ({
      id: c.id,
      name: (c as { name?: string }).name || c.email.split('@')[0],
      email: c.email,
      phone: c.mobile,
      message: (c as { message?: string }).message || c.type || '',
      status:
        c.status === 'completed' ? 'resolved' : c.status === 'processing' ? 'contacted' : 'new',
      createdAt: c.createdAt,
    }));
  }

  async getContactById(id: string) {
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundError('Contact inquiry not found');
    }

    return {
      id: contact.id,
      name: (contact as { name?: string }).name || contact.email.split('@')[0],
      email: contact.email,
      phone: contact.mobile,
      message: (contact as { message?: string }).message || contact.type || '',
      status:
        contact.status === 'completed'
          ? 'resolved'
          : contact.status === 'processing'
            ? 'contacted'
            : 'new',
      createdAt: contact.createdAt,
    };
  }

  async updateContactStatus(id: string, statusInput: string) {
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundError('Contact inquiry not found');
    }

    let status: 'pending' | 'processing' | 'completed' | 'rejected' = 'pending';
    if (statusInput === 'resolved' || statusInput === 'completed') {
      status = 'completed';
    } else if (statusInput === 'contacted' || statusInput === 'processing') {
      status = 'processing';
    } else if (statusInput === 'rejected') {
      status = 'rejected';
    }

    await prisma.contact.update({
      where: { id },
      data: { status },
    });

    return `Contact status updated to ${status}`;
  }
}

export const contactService = new ContactService();
