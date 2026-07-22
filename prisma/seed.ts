/**
 * Database seed script.
 *
 * Wipes every collection then inserts linked test data across all tables
 * so every API can be exercised end-to-end.
 *
 * Run:  npx tsx prisma/seed.ts   (or `npm run seed` once wired in package.json)
 */
import { PrismaClient, Prisma, ReservationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Password@123';

const daysFromNow = (days: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

/**
 * Deletes all documents from every collection. Children first, parents last,
 * so no dangling references remain mid-wipe.
 */
async function clearDatabase() {
  // Deepest children / join tables first.
  await prisma.clinicalAssessment.deleteMany();
  await prisma.treatmentSessionReview.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.couponAssignment.deleteMany();
  await prisma.couponTherapist.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.treatmentSessionBill.deleteMany();
  await prisma.treatmentSession.deleteMany();
  await prisma.slotReservation.deleteMany();
  await prisma.therapistReview.deleteMany();
  await prisma.patientReview.deleteMany();
  await prisma.treatmentPlan.deleteMany();

  await prisma.blogReviewLike.deleteMany();
  await prisma.blogLike.deleteMany();
  await prisma.blogReview.deleteMany();
  await prisma.blog.deleteMany();

  await prisma.payout.deleteMany();
  await prisma.therapistWallet.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.coupon.deleteMany();

  await prisma.therapistArticle.deleteMany();
  await prisma.therapistFAQ.deleteMany();
  await prisma.therapistLeave.deleteMany();
  await prisma.therapistSlot.deleteMany();
  await prisma.accountDetail.deleteMany();
  await prisma.therapistMeta.deleteMany();
  await prisma.therapistLocation.deleteMany();
  await prisma.therapist.deleteMany();

  await prisma.patientDetail.deleteMany();
  await prisma.patientLocation.deleteMany();
  await prisma.patient.deleteMany();

  await prisma.reply.deleteMany();
  await prisma.complaint.deleteMany();
  try {
    await prisma.$runCommandRaw({ dropIndexes: 'Complaint', index: '*' });
  } catch {
    // Index may already be dropped
  }
  await prisma.contact.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.systemConfig.deleteMany();

  await prisma.authSession.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Main seed routine — creates one coherent graph of test data.
 */
async function main() {
  console.log('🧹 Clearing database...');
  await clearDatabase();

  const password = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  console.log('🌱 Seeding database...');

  // ---- USERS ----
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@physiobuddies.com',
      phone: '9000000001',
      password,
      role: 'admin',
      status: 'active',
      image: null,
    },
  });

  const therapistUsers = await Promise.all(
    [
      { name: 'Dr. Aarav Mehta', email: 'aarav@physiobuddies.com', phone: '9000000101' },
      { name: 'Dr. Sara Khan', email: 'sara@physiobuddies.com', phone: '9000000102' },
      { name: 'Dr. Rohan Iyer', email: 'rohan@physiobuddies.com', phone: '9000000103' },
    ].map((t) =>
      prisma.user.create({
        data: { ...t, password, role: 'therapist', status: 'active' },
      }),
    ),
  );

  const patientUsers = await Promise.all(
    [
      { name: 'Priya Sharma', email: 'priya@example.com', phone: '9000000201' },
      { name: 'Karan Verma', email: 'karan@example.com', phone: '9000000202' },
      { name: 'Neha Gupta', email: 'neha@example.com', phone: '9000000203' },
    ].map((p) =>
      prisma.user.create({
        data: { ...p, password, role: 'patient', status: 'active' },
      }),
    ),
  );

  // ---- AUTH SESSIONS (one per user) ----
  await Promise.all(
    [adminUser, ...therapistUsers, ...patientUsers].map((u, i) =>
      prisma.authSession.create({
        data: {
          userId: u.id,
          agent: 'seed-script/1.0',
          location: 'Delhi, IN',
          ip: `127.0.0.${i + 1}`,
          refreshToken: `seed-refresh-token-${u.id}`,
          lastLoggedAt: new Date(),
          expiredAt: daysFromNow(30),
        },
      }),
    ),
  );

  // ---- THERAPISTS + LOCATION + META + ACCOUNTS + SLOTS ----
  const therapistSeed = [
    {
      displayAddress: 'Pitampura, New Delhi',
      city: 'New Delhi',
      lat: 28.698,
      lng: 77.13,
      price: 799,
      priceAlt: 1199,
      gender: 'male' as const,
      mode: 'home_visit' as const,
      specialization: ['Sports Physio', 'Ortho Physio'],
      experience: 8,
      rating: 4.8,
    },
    {
      displayAddress: 'Bandra West, Mumbai',
      city: 'Mumbai',
      lat: 19.0596,
      lng: 72.8295,
      price: 999,
      priceAlt: 1499,
      gender: 'female' as const,
      mode: 'clinic' as const,
      specialization: ['Neuro Physio', "Women's Health Physio"],
      experience: 12,
      rating: 4.9,
    },
    {
      displayAddress: 'Koramangala, Bengaluru',
      city: 'Bengaluru',
      lat: 12.9352,
      lng: 77.6245,
      price: 599,
      priceAlt: null,
      gender: 'male' as const,
      mode: 'online' as const,
      specialization: ['General Physio', 'Geriatric Physio'],
      experience: 5,
      rating: 4.5,
    },
  ];

  const therapists = [];
  for (let i = 0; i < therapistSeed.length; i++) {
    const s = therapistSeed[i]!;
    const user = therapistUsers[i]!;

    const therapist = await prisma.therapist.create({
      data: {
        userId: user.id,
        therapistId: `THR-2026-${String(i + 1).padStart(3, '0')}`,
        location: { lat: s.lat, lng: s.lng },
        displayAddress: s.displayAddress,
        price: s.price,
        priceAlt: s.priceAlt,
        commissionRate: 0.2,
        rating: s.rating,
        gender: s.gender,
        mode: s.mode,
        about: `Experienced physiotherapist specializing in ${s.specialization.join(' & ')}.`,
        verifiedAt: new Date(),
      },
    });

    const location = await prisma.therapistLocation.create({
      data: {
        therapistId: therapist.id,
        address: s.displayAddress,
        city: s.city,
        state: s.city === 'Mumbai' ? 'Maharashtra' : s.city === 'Bengaluru' ? 'Karnataka' : 'Delhi',
        country: 'India',
        postalCode: '110001',
        location: { lat: s.lat, lng: s.lng },
      },
    });

    await prisma.therapistMeta.create({
      data: {
        therapistId: therapist.id,
        locationId: location.id,
        dob: new Date(1990 - s.experience, 4, 15),
        experience: s.experience,
        specialization: s.specialization,
        languagesSpoken: ['English', 'Hindi'],
        educationQualification: ['BPT', 'MPT'],
        currentlyAffiliation: 'PhysioBuddies Network',
        IAPId: `IAP-${1000 + i}`,
        professionalCertificates: ['Certified Manual Therapist'],
      },
    });

    await prisma.accountDetail.create({
      data: {
        therapistId: therapist.id,
        accountHolderName: user.name,
        bankName: 'HDFC Bank',
        branchName: s.city,
        accountNumber: `1234567890${i}`,
        ifsc: 'HDFC0001234',
        upi: `therapist${i + 1}@upi`,
        isDefault: true,
        payoutMethod: 'upi',
      },
    });

    await prisma.therapistSlot.create({
      data: {
        therapistId: therapist.id,
        schedule: {
          monday: ['morning', 'evening'],
          tuesday: ['morning', 'evening'],
          wednesday: ['morning'],
          thursday: ['evening', 'night'],
          friday: ['morning', 'evening'],
          saturday: ['morning'],
          sunday: [],
        },
      },
    });

    await prisma.therapistLeave.create({
      data: {
        therapistId: therapist.id,
        startDate: daysFromNow(15),
        endDate: daysFromNow(17),
        reason: 'Personal leave',
      },
    });

    await prisma.therapistArticle.create({
      data: {
        therapistId: therapist.id,
        title: `${s.specialization[0]}: Recovery Tips`,
        content: 'Consistent movement and guided exercises accelerate recovery.',
      },
    });

    await prisma.therapistFAQ.create({
      data: {
        therapistId: therapist.id,
        question: 'How many sessions will I need?',
        answer: 'It depends on your condition, typically 6-10 sessions.',
      },
    });

    await prisma.subscription.create({
      data: {
        therapistId: therapist.id,
        isActive: true,
        startDate: daysFromNow(-10),
        endDate: daysFromNow(355),
      },
    });

    therapists.push(therapist);
  }

  // ---- PATIENTS + DETAILS + LOCATIONS ----
  const patients = [];
  const patientDetails = [];
  const patientLocations = [];
  const patientGenders = ['female', 'male', 'female'] as const;

  for (let i = 0; i < patientUsers.length; i++) {
    const user = patientUsers[i]!;
    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        patientId: `PAT-2026-${String(i + 1).padStart(3, '0')}`,
      },
    });

    const detail = await prisma.patientDetail.create({
      data: {
        patientId: patient.id,
        name: user.name,
        dob: new Date(1995 - i, 6, 20),
        gender: patientGenders[i]!,
        phone: user.phone!,
        heightCm: 165 + i * 5,
        weightKg: 60 + i * 8,
      },
    });

    const location = await prisma.patientLocation.create({
      data: {
        patientId: patient.id,
        address: `${100 + i}, Green Avenue`,
        landmark: 'Near City Park',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        postalCode: '110002',
        location: { lat: 28.61 + i * 0.01, lng: 77.21 + i * 0.01 },
      },
    });

    patients.push(patient);
    patientDetails.push(detail);
    patientLocations.push(location);
  }

  // ---- SLOT RESERVATIONS / THERAPIST SESSIONS ----
  const reservationsData: Prisma.SlotReservationUncheckedCreateInput[] = [
    // Dr. Aarav Mehta (therapists[0])
    {
      therapistId: therapists[0]!.id,
      patientId: patients[0]!.id,
      startHour: 10,
      startTime: daysFromNow(0, 10),
      endTime: daysFromNow(0, 11),
      date: daysFromNow(0),
      status: 'booked',
    },
    {
      therapistId: therapists[0]!.id,
      patientId: patients[1]!.id,
      startHour: 14,
      startTime: daysFromNow(1, 14),
      endTime: daysFromNow(1, 15),
      date: daysFromNow(1),
      status: 'booked',
    },
    {
      therapistId: therapists[0]!.id,
      patientId: patients[2]!.id,
      startHour: 16,
      startTime: daysFromNow(2, 16),
      endTime: daysFromNow(2, 17),
      date: daysFromNow(2),
      status: 'booked',
    },
    {
      therapistId: therapists[0]!.id,
      patientId: patients[0]!.id,
      startHour: 11,
      startTime: daysFromNow(-5, 11),
      endTime: daysFromNow(-5, 12),
      date: daysFromNow(-5),
      status: 'booked',
    },
    // Dr. Sara Khan (therapists[1])
    {
      therapistId: therapists[1]!.id,
      patientId: patients[1]!.id,
      startHour: 11,
      startTime: daysFromNow(0, 11),
      endTime: daysFromNow(0, 12),
      date: daysFromNow(0),
      status: 'booked',
    },
    {
      therapistId: therapists[1]!.id,
      patientId: patients[0]!.id,
      startHour: 16,
      startTime: daysFromNow(3, 16),
      endTime: daysFromNow(3, 17),
      date: daysFromNow(3),
      status: 'booked',
    },
    {
      therapistId: therapists[1]!.id,
      patientId: patients[2]!.id,
      startHour: 9,
      startTime: daysFromNow(-2, 9),
      endTime: daysFromNow(-2, 10),
      date: daysFromNow(-2),
      status: 'booked',
    },
    // Dr. Rohan Iyer (therapists[2])
    {
      therapistId: therapists[2]!.id,
      patientId: patients[2]!.id,
      startHour: 12,
      startTime: daysFromNow(0, 12),
      endTime: daysFromNow(0, 13),
      date: daysFromNow(0),
      status: 'booked',
    },
    {
      therapistId: therapists[2]!.id,
      patientId: patients[1]!.id,
      startHour: 15,
      startTime: daysFromNow(2, 15),
      endTime: daysFromNow(2, 16),
      date: daysFromNow(2),
      status: 'booked',
    },
    {
      therapistId: therapists[2]!.id,
      patientId: patients[0]!.id,
      startHour: 10,
      startTime: daysFromNow(-3, 10),
      endTime: daysFromNow(-3, 11),
      date: daysFromNow(-3),
      status: 'booked',
    },
  ];

  for (const rData of reservationsData) {
    await prisma.slotReservation.create({
      data: rData,
    });
  }

  // ---- SUBSCRIPTION PAYMENT ----
  for (let i = 0; i < therapistUsers.length; i++) {
    const sub = await prisma.subscription.findFirst({
      where: { therapistId: therapists[i]!.id },
    });
    if (sub) {
      await prisma.payment.create({
        data: {
          userId: therapistUsers[i]!.id,
          invoiceId: `INV-SUB-000${i + 1}`,
          webhookEventId: `evt_seed_sub_000${i + 1}`,
          status: 'completed',
          amount: 2999,
          paidAt: daysFromNow(-10),
          purpose: 'subscription',
          subscriptionId: sub.id,
        },
      });
    }
  }

  // ---- TREATMENT PLAN (patient 0 <-> therapist 0) ----
  const patient0 = patients[0]!;
  const detail0 = patientDetails[0]!;
  const loc0 = patientLocations[0]!;
  const therapist0 = therapists[0]!;

  const therapistSnapshot = {
    name: therapistUsers[0]!.name,
    displayAddress: therapist0.displayAddress,
    price: therapist0.price,
  };
  const patientDetailsSnapshot = {
    name: detail0.name,
    gender: detail0.gender,
    phone: detail0.phone,
  };
  const locationSnapshot = {
    address: loc0.address,
    city: loc0.city,
    location: loc0.location,
  };

  const treatmentPlan = await prisma.treatmentPlan.create({
    data: {
      patientId: patient0.id,
      therapistId: therapist0.id,
      locationId: loc0.id,
      patientDetailId: detail0.id,
      status: 'ongoing',
      suggestedTreatmentDays: 10,
      patientDetailsSnapshot,
      locationSnapshot,
      therapistSnapshot,
    },
  });

  // ---- SLOT RESERVATIONS ----
  // One booked (past, completed session), one blocked (therapist unavailable).
  const bookedReservation = await prisma.slotReservation.create({
    data: {
      therapistId: therapist0.id,
      patientId: patient0.id,
      startHour: 10,
      startTime: daysFromNow(-2, 10),
      endTime: daysFromNow(-2, 11),
      date: daysFromNow(-2, 0),
      status: 'booked',
    },
  });

  await prisma.slotReservation.create({
    data: {
      therapistId: therapist0.id,
      startHour: 14,
      startTime: daysFromNow(3, 14),
      endTime: daysFromNow(3, 15),
      date: daysFromNow(3, 0),
      status: 'blocked',
    },
  });

  // ---- TREATMENT SESSION (completed) ----
  const session = await prisma.treatmentSession.create({
    data: {
      treatmentPlanId: treatmentPlan.id,
      reservationId: bookedReservation.id,
      date: daysFromNow(-2, 10),
      status: 'completed',
      mode: 'home_visit',
      condition: 'Lower back pain',
      DescribedAs: 'Chronic discomfort after prolonged sitting',
      startAt: daysFromNow(-2, 10),
      endAt: daysFromNow(-2, 11),
      therapistSnapshot,
      patientDetailSnapshot: patientDetailsSnapshot,
      priceAtBooking: therapist0.price,
      addressSnapshot: locationSnapshot,
    },
  });

  // ---- PAYMENT + BILL + COMMISSION + WALLET + PAYOUT ----
  const sessionAmount = therapist0.price;
  const platformRate = therapist0.commissionRate;
  const platformFee = Math.round(sessionAmount * platformRate);
  const therapistAmount = sessionAmount - platformFee;

  const payment = await prisma.payment.create({
    data: {
      userId: patientUsers[0]!.id,
      invoiceId: 'INV-SESS-0001',
      gatewayPaymentId: 'pay_seed_0001',
      gatewayOrderId: 'order_seed_0001',
      webhookEventId: 'evt_seed_sess_0001',
      status: 'completed',
      amount: sessionAmount,
      paidAt: daysFromNow(-2, 9),
      purpose: 'therapy_session',
    },
  });

  const bill = await prisma.treatmentSessionBill.create({
    data: {
      paymentId: payment.id,
      sessionId: session.id,
      sessionDate: session.date,
      therapistId: therapist0.id,
      patientId: patient0.id,
      amountAllocated: sessionAmount,
      status: 'released',
      releasedAt: daysFromNow(-1),
      paymentAmountMetaData: { original: sessionAmount, currency: 'INR' },
    },
  });

  await prisma.commission.create({
    data: {
      billId: bill.id,
      therapistId: therapist0.id,
      therapistName: therapistUsers[0]!.name,
      sessionDate: session.date,
      patientName: detail0.name,
      sessionAmount,
      platformFee,
      therapistAmount,
      platformRateUsed: platformRate,
    },
  });

  // Wallet: credit the earning, then a payout debit.
  await prisma.therapistWallet.create({
    data: {
      therapistId: therapist0.id,
      amount: therapistAmount,
      type: 'earning',
      referenceId: bill.id,
      balanceAfter: therapistAmount,
    },
  });

  const payout = await prisma.payout.create({
    data: {
      therapistId: therapist0.id,
      amount: therapistAmount,
      status: 'processed',
      transactionRef: 'UTR-SEED-0001',
      processedBy: adminUser.id,
      processedAt: new Date(),
      requestedFromIp: '127.0.0.1',
      accountSnapshotJson: { upi: 'therapist1@upi', bankName: 'HDFC Bank' },
    },
  });

  await prisma.therapistWallet.create({
    data: {
      therapistId: therapist0.id,
      amount: -therapistAmount,
      type: 'payout',
      referenceId: payout.id,
      balanceAfter: 0,
    },
  });

  // ---- COUPONS ----
  const globalCoupon = await prisma.coupon.create({
    data: {
      code: 'WELCOME100',
      discount: 100,
      minPrice: 500,
      expiresOn: daysFromNow(90),
      status: 'active',
      isGlobal: true,
    },
  });

  const therapistCoupon = await prisma.coupon.create({
    data: {
      therapistId: therapist0.id,
      code: 'AARAV20',
      discount: 20,
      minPrice: 700,
      expiresOn: daysFromNow(60),
      status: 'active',
      isGlobal: false,
    },
  });

  // Coupon usage tied to the completed session.
  await prisma.couponUsage.create({
    data: {
      couponId: globalCoupon.id,
      patientId: patient0.id,
      treatmentSessionId: session.id,
      status: 'consumed',
      usedAt: daysFromNow(-2, 9),
      paymentId: payment.id,
    },
  });

  // Whitelist assignment + therapist constraint for the targeted coupon.
  await prisma.couponAssignment.create({
    data: {
      couponId: therapistCoupon.id,
      patientId: patient0.id,
      type: 'whitelist',
    },
  });

  await prisma.couponTherapist.create({
    data: {
      couponId: therapistCoupon.id,
      therapistId: therapist0.id,
    },
  });

  // ---- REVIEWS ----
  await prisma.therapistReview.create({
    data: {
      patientId: patient0.id,
      therapistId: therapist0.id,
      treatmentPlanId: treatmentPlan.id,
      rating: 5,
      comment: 'Excellent care, noticeable improvement after a few sessions.',
    },
  });

  await prisma.patientReview.create({
    data: {
      patientId: patient0.id,
      therapistId: therapist0.id,
      treatmentPlanId: treatmentPlan.id,
      rating: 4.5,
      comment: 'Cooperative patient, followed the home exercise plan well.',
    },
  });

  await prisma.treatmentSessionReview.create({
    data: {
      sessionId: session.id,
      reviewBy: 'patient',
      comment: 'Very professional and punctual.',
      rating: 5,
      date: daysFromNow(-1),
    },
  });

  // ---- CLINICAL ASSESSMENT ----
  await prisma.clinicalAssessment.create({
    data: {
      treatmentPlanId: treatmentPlan.id,
      assessmentType: 'ORTHO',
      chiefComplaint: ['Lower back pain', 'Stiffness'],
      durationOfSymptoms: 'ONE_TO_THREE_MONTHS',
      painScore: 6,
      painCharacteristics: ['Dull', 'Aching'],
      rom: 'Mild_Restriction',
      muscleStrength: 'Mild_Weakness',
      mobilityDetails: {
        mobilityStatus: 'Independent',
        assistiveDevice: 'None',
        fallRisk: 'Low',
        functionalLimitations: ['Prolonged sitting'],
      },
      problemsIdentified: ['Weak core', 'Poor posture'],
      treatmentPlanItems: ['Core strengthening', 'Posture correction'],
      visitFrequency: 'Three_Times_Week',
      hepGiven: true,
      therapistNotes: 'Patient responding well to conservative management.',
      documentUrls: [],
    },
  });

  // ---- BLOGS + REVIEWS + LIKES ----
  const blog = await prisma.blog.create({
    data: {
      title: '5 Stretches for a Healthy Back',
      content: 'Full article body about back-friendly stretches...',
      summary: 'Simple daily stretches to keep your back pain-free.',
      tags: 'back,stretching,wellness',
      thumbnail: 'https://picsum.photos/seed/back/600/400',
      slug: '5-stretches-for-a-healthy-back',
      readTime: '4 min',
      views: 120,
    },
  });

  const blogReview = await prisma.blogReview.create({
    data: {
      blogId: blog.id,
      userId: patientUsers[0]!.id,
      comment: 'Really helpful, thanks!',
    },
  });

  await prisma.blogReviewLike.create({
    data: { reviewId: blogReview.id, userId: patientUsers[1]!.id },
  });

  await prisma.blogLike.create({
    data: { blogId: blog.id, userId: patientUsers[0]!.id },
  });

  // ---- ACTIVITY + NOTIFICATION ----
  await prisma.activity.create({
    data: {
      userId: patientUsers[0]!.id,
      title: 'Booked a session',
      data: `Session ${session.id} booked`,
      ip: '127.0.0.1',
      type: 'frequent',
    },
  });

  await prisma.notification.create({
    data: {
      userId: patientUsers[0]!.id,
      title: 'Session confirmed',
      description: 'Your session with Dr. Aarav Mehta is confirmed.',
      isRead: false,
      priority: 'high',
      time: new Date(),
    },
  });

  // ---- SYSTEM CONFIG ----
  await prisma.systemConfig.createMany({
    data: [
      { key: 'DEFAULT_COMMISSION_RATE', value: '0.2' },
      { key: 'MIN_BOOKING_LEAD_MINUTES', value: '60' },
      { key: 'PLATFORM_NAME', value: 'PhysioBuddies' },
    ],
  });

  // ---- CONTACT + COMPLAINT + REPLY ----
  await prisma.contact.create({
    data: {
      email: 'lead@example.com',
      mobile: '9000000999',
      type: 'partnership',
      status: 'pending',
    },
  });

  const complaintsData = [
    {
      userId: patientUsers[0]!.id,
      type: 'therapist_issue',
      description: 'Therapist arrived 25 minutes late for home visit.',
      status: 'completed' as const,
      replies: [
        {
          role: 'user' as const,
          message: 'The session was delayed significantly without prior notice.',
        },
        {
          role: 'support' as const,
          message:
            'We sincerely apologize for the inconvenience. A credit voucher has been issued.',
        },
      ],
    },
    {
      userId: patientUsers[1]!.id,
      type: 'billing',
      description: 'I was charged twice for a single session.',
      status: 'processing' as const,
      replies: [
        { role: 'user' as const, message: 'Please refund the duplicate charge.' },
        {
          role: 'support' as const,
          message: 'We are reviewing your transaction with our payment gateway.',
        },
      ],
    },
    {
      userId: patientUsers[2]!.id,
      type: 'technical',
      description: 'Unable to join the video call session.',
      status: 'pending' as const,
      replies: [
        {
          role: 'user' as const,
          message: 'The video call connection kept timing out during my appointment.',
        },
      ],
    },
    {
      userId: therapistUsers[0]!.id,
      type: 'payout',
      description: 'Query regarding weekly payout calculation.',
      status: 'completed' as const,
      replies: [
        {
          role: 'user' as const,
          message: 'Could you verify the platform fee deduction for session INV-SESS-0001?',
        },
        {
          role: 'support' as const,
          message: 'The standard 20% platform commission was applied correctly.',
        },
      ],
    },
  ];

  for (const cData of complaintsData) {
    const complaint = await prisma.complaint.create({
      data: {
        userId: cData.userId,
        type: cData.type,
        description: cData.description,
        status: cData.status,
      },
    });

    await prisma.reply.createMany({
      data: cData.replies.map((r) => ({
        complaintId: complaint.id,
        role: r.role,
        message: r.message,
      })),
    });
  }

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
