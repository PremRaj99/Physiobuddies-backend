import prisma from '@/config/prisma';
import { convertISTRangeToUTC } from '@/core/utils/time-zone';
import { addDays } from 'date-fns';
import z from 'zod';
import { calculateDistance } from './calculateDistance';
import { TherapistQuerySchema } from './therapist.type';

class TherapistService {
  getAllTherapists = async (query: z.infer<typeof TherapistQuerySchema>) => {
    // default pagination values
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    // Initial lightweight query to filter and sort by distance if needed
    const lightweightTherapists = await prisma.therapist.findMany({
      where: {
        ...(query.specialization?.length && {
          meta: { specialization: { hasSome: query.specialization } },
        }),
        ...(query.price?.length === 2 && {
          price: { gte: query.price[0], lte: query.price[1] },
        }),
        ...(query.experience?.length === 2 && {
          meta: { experience: { gte: query.experience[0], lte: query.experience[1] } },
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
      where: { id: therapistId },
      include: {
        user: { select: { name: true, image: true } },
        meta: { select: { experience: true, specialization: true } },
        _count: { select: { reviewsReceived: true } },
      },
    });

    if (!therapist) return null;

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

    // 2. Parallel Fetch
    const [therapistSlot, templates, reservations, leaves] = await Promise.all([
      prisma.therapistSlot.findFirst({ where: { therapistId } }),
      prisma.timeSlotTemplate.findMany({
        where: { isActive: true },
        orderBy: { startTime: 'asc' },
      }),
      prisma.slotReservation.findMany({
        where: {
          therapistId,
          date: { gte: todayStart, lte: threeDaysEnd },
          deletedAt: null,
        },
      }),
      prisma.therapistLeave.findMany({
        where: {
          therapistId,
          startDate: { lte: threeDaysEnd },
          endDate: { gte: todayStart },
        },
      }),
    ]);

    if (!therapistSlot) return [];

    // 3. Create a Map for Reservations: Key is "YYYY-MM-DD_templateId" -> Status
    const reservationMap = new Map(
      reservations.map((r) => [
        `${r.date.toISOString().split('T')[0]}_${r.timeSlotTemplateId}`,
        r.status,
      ]),
    );

    const availableDays = new Set(therapistSlot.availableDays);
    const result = [];

    for (let i = 0; i < 3; i++) {
      const currentDay = addDays(todayStart, i);
      const dateKey = currentDay.toISOString().split('T')[0]; // YYYY-MM-DD

      // Formatting for your specific output "DD-MM-YYYY"
      const [year, month, day] = dateKey.split('-');
      const formattedDate = `${day}-${month}-${year}`;

      const weekday = currentDay.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

      // Check Leave: Compare UTC dates directly (assuming DB stores leave dates as UTC start/end)
      const isDayOnLeave = leaves.some(
        (leave) => currentDay >= leave.startDate && currentDay <= leave.endDate,
      );

      const daySlots = [];

      // If it's a working day AND not on leave, process slots
      if (availableDays.has(weekday) && !isDayOnLeave) {
        for (const template of templates) {
          const slotStart = new Date(currentDay);
          slotStart.setHours(Math.floor(template.startTime / 60), template.startTime % 60, 0, 0);

          // 1. Skip if the time has already passed (for today)
          if (slotStart <= now) continue;

          // 2. Determine Status
          // Check if reservation exists in our Map
          const bookingStatus = reservationMap.get(`${dateKey}_${template.id}`);

          // Map status: if found, use DB status; otherwise, it's "open"
          const status = bookingStatus ? bookingStatus.toLowerCase() : 'open';

          daySlots.push({
            templateId: template.id,
            startTime: template.startTime,
            endTime: template.endTime,
            status: status, // "booked", "hold", "open", etc.
          });
        }
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
}

export const therapistService = new TherapistService();
