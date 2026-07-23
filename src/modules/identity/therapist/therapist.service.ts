import prisma from '@/config/prisma';
import {
  getSlotsForSchedule,
  MIN_BOOKING_LEAD_MINUTES,
  SLOT_DURATION,
} from '@/core/constants/slots';
import { NotFoundError } from '@/core/errors/ApiError';
import { convertISTRangeToUTC } from '@/core/utils/time-zone';
import { SlotManager } from '@/modules/treatment-lifecycle/reservation/slotManagement';
import redisClient from '@/shared/redis';
import { addDays } from 'date-fns';
import { calculateDistance } from './calculateDistance';
import { TherapistQueryDTO } from './therapist.type';

class TherapistService {
  getTherapistByUserId = async (userId: string) => {
    const therapist = await prisma.therapist.findUnique({
      where: { userId, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
    });
    if (!therapist) throw new NotFoundError('Therapist not found');
    return therapist;
  };

  getAllTherapists = async (query: TherapistQueryDTO) => {
    // default pagination values
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    // Initial lightweight query to filter and sort by distance if needed
    const lightweightTherapists = await prisma.therapist.findMany({
      where: {
        ...(query.specialization?.length &&
          query.specialization?.length > 0 && {
            meta: { specialization: { hasSome: query.specialization } },
          }),
        ...(query.price &&
          query.price[0] !== undefined &&
          query.price[1] !== undefined && {
            price: {
              gte: query.price[0],
              lte: query.price[1],
            },
          }),
        ...(query.experience &&
          query.experience[0] !== undefined &&
          query.experience[1] !== undefined && {
            meta: {
              experience: {
                gte: query.experience[0],
                lte: query.experience[1],
              },
            },
          }),
        ...(query.mode && { mode: query.mode }),
        ...(query.gender && { gender: query.gender }),
      },
      select: {
        id: true,
        location: true,
        price: true,
        rating: true,
        meta: { select: { experience: true } }, // Needed if sorting by experience
      },
    });

    // Calculate distance for each therapist and filter/sort if needed
    let processed = lightweightTherapists.map((t) => {
      const lat = Number((t.location as { lat: number })?.lat);
      const lng = Number((t.location as { lng: number })?.lng);
      const distance =
        query.lng && query.lat && lat && lng
          ? calculateDistance(query.lat, query.lng, lat, lng)
          : null;

      return { ...t, distance };
    });

    if (query.radius) {
      processed = processed.filter((t) => t.distance !== null && t.distance <= query.radius!);
    }

    if (query.sort === 'distance') {
      processed.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (query.sort === 'rating') {
      processed.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (query.sort === 'price') {
      processed.sort((a, b) => a.price - b.price);
    } else if (query.sort === 'experience') {
      processed.sort((a, b) => (b.meta?.experience || 0) - (a.meta?.experience || 0));
    }

    // Paginate the results
    const paginatedItems = processed.slice(skip, skip + limit);
    const paginatedIds = paginatedItems.map((t) => t.id);

    if (paginatedIds.length === 0) return [];

    // Fetch full therapist data for the paginated results
    const fullTherapists = await prisma.therapist.findMany({
      where: {
        id: { in: paginatedIds },
      },
      include: {
        user: { select: { name: true, image: true } },
        meta: { select: { experience: true, specialization: true } },
        _count: { select: { reviewsReceived: true } },
      },
    });

    // Map the full data to the response format, ensuring the order matches the paginated items
    return paginatedItems.map((item) => {
      const fullData = fullTherapists.find((t) => t.id === item.id)!;

      return {
        id: fullData.id,
        name: fullData.user.name,
        specializations: fullData.meta?.specialization,
        experience: fullData.meta?.experience,
        rating: fullData.rating,
        totalReviews: fullData._count.reviewsReceived,
        originalPrice: fullData.priceAlt,
        discountedPrice: fullData.price,
        displayAddress: fullData.displayAddress,
        image: fullData.user.image,
        distance: item.distance,
      };
    });
  };

  getTherapistById = async (therapistId: string, location: { lat?: number; lng?: number }) => {
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId, deletedAt: { isSet: false } },
      include: {
        user: { select: { name: true, image: true } },
        meta: { select: { experience: true, specialization: true } },
        _count: { select: { reviewsReceived: true } },
      },
    });

    if (!therapist) throw new NotFoundError('Therapist not found');

    const lat = Number((therapist.location as { lat: number })?.lat);
    const lng = Number((therapist.location as { lng: number })?.lng);

    return {
      id: therapist.id,
      name: therapist.user.name,
      specializations: therapist.meta?.specialization,
      experience: therapist.meta?.experience,
      rating: therapist.rating,
      totalReviews: therapist._count.reviewsReceived,
      originalPrice: therapist.priceAlt,
      discountedPrice: therapist.price,
      displayAddress: therapist.displayAddress,
      image: therapist.user.image,
      about: therapist.about,
      distance:
        location.lat && location.lng
          ? calculateDistance(location.lat, location.lng, lat, lng)
          : null,
    };
  };

  getTherapistReviews = async (
    therapistId: string,
    pagination: { page?: number; limit?: number },
  ) => {
    const limit = pagination.limit || 10;
    const page = pagination.page || 1;
    const skip = (page - 1) * limit;

    const reviews = await prisma.therapistReview.findMany({
      where: { therapistId },
      include: {
        patient: { select: { user: { select: { name: true, image: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return reviews.map(
      (r: {
        rating: number;
        comment: string;
        createdAt: Date;
        patient: {
          user: {
            name: string;
            image: string | null;
          };
        };
      }) => ({
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewerName: r.patient.user.name,
        reviewerImage: r.patient.user.image,
      }),
    );
  };

  getTherapistArticles = async (
    therapistId: string,
    pagination: { page?: number; limit?: number },
  ) => {
    const limit = pagination.limit || 10;
    const page = pagination.page || 1;
    const skip = (page - 1) * limit;

    const articles = await prisma.therapistArticle.findMany({
      where: { therapistId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return articles.map((a: { title: string; content: string; createdAt: Date }) => ({
      title: a.title,
      content: a.content,
      createdAt: a.createdAt,
    }));
  };

  getTherapistFaqs = async (therapistId: string, pagination: { page?: number; limit?: number }) => {
    const limit = pagination.limit || 10;
    const page = pagination.page || 1;
    const skip = (page - 1) * limit;

    const faqs = await prisma.therapistFAQ.findMany({
      where: { therapistId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return faqs.map((f: { question: string; answer: string; createdAt: Date }) => ({
      question: f.question,
      answer: f.answer,
      createdAt: f.createdAt,
    }));
  };

  getTherapistAvailability = async (therapistId: string) => {
    const now = new Date();

    // 1. Setup Time Range (3 days)
    const { startUtc: todayStart, endUtc: threeDaysEnd } = convertISTRangeToUTC(
      now,
      addDays(now, 2),
    );

    // Construct slot hold keys for all 16 slots of the 3 days to keep queries parallel
    const { slotKeys, keyToSlotMap } = SlotManager.getSlotHoldKeys(therapistId, todayStart, 3);

    // 2. Parallel Fetch
    const [therapistSlot, reservations, leaves, redisHolds] = await Promise.all([
      prisma.therapistSlot.findUnique({ where: { therapistId } }),
      prisma.slotReservation.findMany({
        where: {
          therapistId,
          date: { gte: todayStart, lte: threeDaysEnd },
          OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
        },
      }),
      prisma.therapistLeave.findMany({
        where: {
          therapistId,
          startDate: { lte: threeDaysEnd },
          endDate: { gte: todayStart },
        },
      }),
      redisClient.mGet(slotKeys),
    ]);

    if (!therapistSlot) return [];

    const schedule = therapistSlot.schedule as Record<string, string[]>;

    const heldSlotsMap = new Map<string, string>(); // Key: "YYYY-MM-DD_startHour" -> reservationId
    slotKeys.forEach((key, index) => {
      const val = redisHolds[index];
      if (val) {
        const slotInfo = keyToSlotMap.get(key);
        if (slotInfo) {
          heldSlotsMap.set(`${slotInfo.dateKey}_${slotInfo.startHour}`, val);
        }
      }
    });

    // 3. Create a Map for DB Reservations: Key is "YYYY-MM-DD_startHour" → reservation
    const reservationMap = new Map(
      reservations.map((r) => [
        `${r.date.toISOString().split('T')[0]}_${r.startHour}`,
        { status: r.status, expiresAt: r.expiresAt },
      ]),
    );

    const result = [];

    for (let i = 0; i < 3; i++) {
      const currentDay = addDays(todayStart, i);
      const dateKey = currentDay.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dateKey) break;

      // Formatting for output "DD-MM-YYYY"
      const [year, month, day] = dateKey.split('-');
      const formattedDate = `${day}-${month}-${year}`;

      const WEEKDAYS = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const weekday = WEEKDAYS[currentDay.getUTCDay()] as string;

      // Check Leave: Compare UTC dates directly
      const isDayOnLeave = leaves.some(
        (leave) => currentDay >= leave.startDate && currentDay <= leave.endDate,
      );

      if (isDayOnLeave) continue;

      // Get available slots for this weekday based on therapist's schedule
      const availableSlots = getSlotsForSchedule(schedule, weekday);
      if (availableSlots.length === 0) continue;

      const daySlots = [];

      for (const slotDef of availableSlots) {
        const slotStart = new Date(currentDay);
        slotStart.setUTCHours(slotDef.startHour, slotDef.startMinute, 0, 0);

        // 1. Skip if the time has already passed (for today)
        if (slotStart <= now) continue;

        // 2. Skip if less than 1 hour lead time
        const leadTimeMs = slotStart.getTime() - now.getTime();
        if (leadTimeMs < MIN_BOOKING_LEAD_MINUTES * 60 * 1000) continue;

        // 3. Determine Status from reservation map or Redis holds
        const reservation = reservationMap.get(`${dateKey}_${slotDef.startHour}`);
        const redisHoldValue = heldSlotsMap.get(`${dateKey}_${slotDef.startHour}`);

        let status = 'open';
        if (reservation) {
          status = reservation.status.toLowerCase();
        } else if (redisHoldValue) {
          status = 'hold';
        }

        daySlots.push({
          startHour: slotDef.startHour,
          startTime: slotDef.startHour * 60, // minutes from midnight
          endTime: slotDef.startHour * 60 + SLOT_DURATION,
          category: slotDef.category,
          status, // "booked", "hold", "blocked", "open"
        });
      }

      if (daySlots.length > 0) {
        result.push({
          date: formattedDate,
          timeSlots: daySlots,
        });
      }
    }

    return result;
  };

  getDashboardData = async (userId: string) => {
    const therapist = await prisma.therapist.findFirst({
      where: { userId, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!therapist) {
      throw new NotFoundError('Therapist profile not found');
    }

    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Today's Sessions from SlotReservations
    const todayReservations = await prisma.slotReservation.findMany({
      where: {
        therapistId: therapist.id,
        date: { gte: todayStart, lte: todayEnd },
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
      include: {
        patient: {
          include: {
            details: true,
            user: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { startHour: 'asc' },
    });

    const todaySessions = todayReservations.map((res) => {
      const patientDetail = (
        res.patient as unknown as {
          details?: Array<{ name?: string; dob?: Date; gender?: string }>;
        }
      )?.details?.[0];
      const dob = patientDetail?.dob;
      const age = dob ? now.getFullYear() - new Date(dob).getFullYear() : 30;

      const startHourNum = res.startHour || new Date(res.startTime).getHours();
      const startAmPm = startHourNum >= 12 ? 'PM' : 'AM';
      const formattedStartHour = startHourNum % 12 || 12;
      const endHourNum = (startHourNum + 1) % 24;
      const endAmPm = endHourNum >= 12 ? 'PM' : 'AM';
      const formattedEndHour = endHourNum % 12 || 12;
      const timeSlot = `${String(formattedStartHour).padStart(2, '0')}:00 ${startAmPm} - ${String(formattedEndHour).padStart(2, '0')}:00 ${endAmPm}`;

      let status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'PENDING' = 'UPCOMING';
      if (res.status === 'blocked') status = 'CANCELLED';
      else if (new Date(res.startTime) < now) status = 'COMPLETED';

      return {
        id: res.id,
        patientName: patientDetail?.name || res.patient?.user?.name || 'Patient',
        patientAge: age,
        patientGender: patientDetail?.gender || 'Other',
        timeSlot,
        mode: therapist.mode || 'home_visit',
        status,
      };
    });

    // 2. Active Patients Count
    const activePlansCount = await prisma.treatmentPlan.count({
      where: {
        therapistId: therapist.id,
        status: { in: ['created', 'treatment_planned', 'ongoing'] },
      },
    });

    // 3. New Patients This Week
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentReservations = await prisma.slotReservation.findMany({
      where: {
        therapistId: therapist.id,
        startTime: { gte: sevenDaysAgo },
        patientId: { not: null },
      },
      select: { patientId: true },
    });
    const distinctRecentPatients = new Set(
      recentReservations.map((r) => r.patientId).filter(Boolean),
    );

    // 4. Monthly Net Revenue
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyCommissions = await prisma.commission.findMany({
      where: {
        therapistId: therapist.id,
        calculatedAt: { gte: startOfMonth },
      },
    });
    const monthlyRevenue = monthlyCommissions.reduce((acc, c) => acc + c.therapistAmount, 0);

    // 5. Ratings & Reviews Average
    const reviews = await prisma.therapistReview.findMany({
      where: {
        therapistId: therapist.id,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });
    const totalRatings = reviews.length;
    const avgRating =
      totalRatings > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10) / 10
        : therapist.rating || 4.8;

    // 6. Weekly Trend (Current Mon-Sun sessions)
    const dayOfWeek = now.getDay();
    const distToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monDate = new Date(now);
    monDate.setDate(now.getDate() - distToMon);
    monDate.setHours(0, 0, 0, 0);

    const weekEnd = new Date(monDate);
    weekEnd.setDate(monDate.getDate() + 7);

    const weekReservations = await prisma.slotReservation.findMany({
      where: {
        therapistId: therapist.id,
        date: { gte: monDate, lt: weekEnd },
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyTrend = dayLabels.map((label, idx) => {
      const targetDate = new Date(monDate);
      targetDate.setDate(monDate.getDate() + idx);
      const count = weekReservations.filter((r) => {
        const rDate = new Date(r.date);
        return (
          rDate.getFullYear() === targetDate.getFullYear() &&
          rDate.getMonth() === targetDate.getMonth() &&
          rDate.getDate() === targetDate.getDate()
        );
      }).length;
      return { day: label, sessions: count };
    });

    // 7. Monthly Trend (Past 6 months earnings)
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const pastCommissions = await prisma.commission.findMany({
      where: {
        therapistId: therapist.id,
        calculatedAt: { gte: sixMonthsAgo },
      },
    });

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mYear = mDate.getFullYear();
      const mMonth = mDate.getMonth();
      const mLabel = monthNames[mMonth];

      const sum = pastCommissions
        .filter((c) => {
          const d = new Date(c.calculatedAt);
          return d.getFullYear() === mYear && d.getMonth() === mMonth;
        })
        .reduce((acc, c) => acc + c.therapistAmount, 0);

      monthlyTrend.push({ month: mLabel, earnings: sum });
    }

    // 8. Consultation Types Distribution
    const allReservations = await prisma.slotReservation.findMany({
      where: {
        therapistId: therapist.id,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });

    const totalRes = allReservations.length || 1;
    const modeCounts = { home_visit: 0, online: 0, clinic: 0 };
    if (therapist.mode === 'home_visit') modeCounts.home_visit += 1;
    else if (therapist.mode === 'online') modeCounts.online += 1;
    else if (therapist.mode === 'clinic') modeCounts.clinic += 1;

    const treatmentModeData = [
      {
        name: 'Home Visit',
        value: Math.round((modeCounts.home_visit / totalRes) * 100) || 50,
        color: '#014f86',
      },
      {
        name: 'Online',
        value: Math.round((modeCounts.online / totalRes) * 100) || 30,
        color: '#a9d6e5',
      },
      {
        name: 'Clinic',
        value: Math.round((modeCounts.clinic / totalRes) * 100) || 20,
        color: '#013a63',
      },
    ];

    return {
      todaySessions,
      activePatients: activePlansCount,
      newPatientsThisWeek: distinctRecentPatients.size,
      monthlyRevenue,
      commissionRate: therapist.commissionRate,
      rating: avgRating,
      totalRatings,
      weeklyTrend,
      monthlyTrend,
      treatmentModeData,
    };
  };
}

export const therapistService = new TherapistService();
