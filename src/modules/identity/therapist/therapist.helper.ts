import { calculateDistance } from '@/shared/helper/location.helper';
import { TherapistQueryDTO } from './therapist.type';

export interface LightweightTherapistItem {
  id: string;
  location?: unknown;
  price: number;
  rating?: number | null;
  meta?: { experience?: number } | null;
}

/**
 * Builds Prisma filter conditions for therapist query based on DTO parameters.
 */
export const buildTherapistQueryWhereClause = (query: TherapistQueryDTO) => {
  return {
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
  };
};

/**
 * Computes distances and sorts/filters lightweight therapist list.
 */
export const processAndSortTherapists = (
  therapists: LightweightTherapistItem[],
  query: TherapistQueryDTO,
) => {
  let processed = therapists.map((t) => {
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

  return processed;
};
