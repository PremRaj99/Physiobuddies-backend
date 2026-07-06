import { NotFoundError } from '@/core/errors/ApiError';
import { SubmitFinalOnboardingDTO, SubmitOnboardingDTO } from './therapistMeta.type';
import prisma from '@/config/prisma';

class TherapistMetaService {
  submitOnboarding = async (userId: string, data: SubmitOnboardingDTO) => {
    const therapist = await prisma.therapist.findUnique({
      where: { userId },
      include: { meta: true },
    });

    if (!therapist) {
      throw new NotFoundError('Therapist profile not found');
    }

    // 1. Create location record for therapist meta
    const location = await prisma.therapistLocation.create({
      data: {
        therapistId: therapist.id,
        address: data.displayAddress,
        city: 'Unknown',
        state: 'Unknown',
        country: 'India',
        postalCode: '000000',
        location: therapist.location || { lat: 0, lng: 0 },
      },
    });

    // 2. Create meta record
    const meta = await prisma.therapistMeta.create({
      data: {
        therapistId: therapist.id,
        locationId: location.id,
        dob: new Date(data.dob),
        experience: Number(data.experience),
        specialization: data.specializations,
        languagesSpoken: data.languages,
        educationQualification: data.education,
        currentlyAffiliation: data.affiliation || '',
        IAPId: data.iapId || '',
        resume: data.resume || '',
        professionalCertificates: data.certificates || [],
      },
    });

    // 3. Update therapist description and displayAddress
    await prisma.therapist.update({
      where: { id: therapist.id },
      data: {
        about: data.about,
        displayAddress: data.displayAddress,
      },
    });

    return { therapistId: therapist.id, metaId: meta.id };
  };

  submitFinalOnboarding = async (userId: string, data: SubmitFinalOnboardingDTO) => {
    const therapist = await prisma.therapist.findUnique({
      where: { userId },
    });

    if (!therapist) {
      throw new NotFoundError('Therapist profile not found');
    }

    // 1. Update therapist about description, displayAddress, and coordinates
    await prisma.therapist.update({
      where: { id: therapist.id },
      data: {
        about: data.about,
        displayAddress: data.address,
        location: {
          lat: Number(data.lat),
          lng: Number(data.lng),
        },
      },
    });

    // 2. Create bank account details
    const account = await prisma.accountDetail.create({
      data: {
        therapistId: therapist.id,
        accountHolderName: data.accountName,
        bankName: data.bankName,
        branchName: data.branchName,
        accountNumber: data.accountNumber,
        ifsc: data.ifsc,
        upi: data.upiId || '',
        isDefault: true,
      },
    });

    // 3. Create or update Therapist Slot available days
    const availableDays = Object.keys(data.slots).map((d) => d.toLowerCase());
    const existingSlot = await prisma.therapistSlot.findFirst({
      where: { therapistId: therapist.id },
    });

    let slot;
    if (existingSlot) {
      slot = await prisma.therapistSlot.update({
        where: { id: existingSlot.id },
        data: { availableDays },
      });
    } else {
      slot = await prisma.therapistSlot.create({
        data: {
          therapistId: therapist.id,
          availableDays,
        },
      });
    }

    // TODO: payment for subscription

    // 4. Create subscription plan entry
    const months = data.planId === '3m' ? 3 : data.planId === '6m' ? 6 : 12;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const subscription = await prisma.subscription.create({
      data: {
        therapistId: therapist.id,
        isActive: true,
        startDate: new Date(),
        endDate,
      },
    });

    return {
      therapistId: therapist.id,
      accountId: account.id,
      slotId: slot.id,
      subscriptionId: subscription.id,
    };
  };
}

export const therapistMetaService = new TherapistMetaService();
