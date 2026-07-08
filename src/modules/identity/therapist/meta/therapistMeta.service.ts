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

    // 2. Create bank account details (save bank details only if all fields are present, otherwise save upi only)
    const hasFullBankDetails = !!(
      data.accountName?.trim() &&
      data.bankName?.trim() &&
      data.branchName?.trim() &&
      data.accountNumber?.trim() &&
      data.ifsc?.trim()
    );

    const account = await prisma.accountDetail.create({
      data: {
        therapistId: therapist.id,
        accountHolderName: hasFullBankDetails ? (data.accountName ?? null) : null,
        bankName: hasFullBankDetails ? (data.bankName ?? null) : null,
        branchName: hasFullBankDetails ? (data.branchName ?? null) : null,
        accountNumber: hasFullBankDetails ? (data.accountNumber ?? null) : null,
        ifsc: hasFullBankDetails ? (data.ifsc ?? null) : null,
        upi: data.upiId ?? null,
        isDefault: true,
      },
    });

    // 3. Create or update Therapist Slot schedule (weekday → categories)
    const slot = await prisma.therapistSlot.upsert({
      where: { therapistId: therapist.id },
      update: { schedule: data.slots },
      create: {
        therapistId: therapist.id,
        schedule: data.slots,
      },
    });

    // TODO: payment for subscription

    // 4. Create subscription plan entry
    let months;
    switch (data.planId) {
      case '3m':
        months = 3;
        break;
      case '6m':
        months = 6;
        break;
      case '12m':
        months = 12;
        break;
      default:
        months = 1; // free trial period
      // TODO: Implement free trail period fix it
      // throw new NotFoundError('Invalid plan id');
    }
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
