import type { NextFunction, Request, Response } from 'express';
import { therapistService } from './therapist.service';
import { OkResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { TherapistQuerySchema } from './therapist.type';
import { ObjectIdSchema } from '../auth/auth.type';

class TherapistController {
  async getAllTherapists(req: Request, res: Response, _next: NextFunction) {
    const query = validateSchema(TherapistQuerySchema, req.query);
    const therapists = await therapistService.getAllTherapists(query);

    return new OkResponse(therapists).send(res);
  }

  async getTherapistById(req: Request, res: Response, _next: NextFunction) {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    const { lat, lng } = validateSchema(TherapistQuerySchema, req.query);
    const location = {
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
    };

    const therapist = await therapistService.getTherapistById(therapistId, location);

    return new OkResponse(therapist).send(res);
  }

  async getTherapistReviews(req: Request, res: Response, _next: NextFunction) {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    const { page, limit } = validateSchema(TherapistQuerySchema, req.query);
    const reviews = await therapistService.getTherapistReviews(therapistId, { page, limit });

    return new OkResponse(reviews).send(res);
  }

  async getTherapistArticles(req: Request, res: Response, _next: NextFunction) {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    const { page, limit } = validateSchema(TherapistQuerySchema, req.query);
    const articles = await therapistService.getTherapistArticles(therapistId, { page, limit });

    return new OkResponse(articles).send(res);
  }

  async getTherapistFaqs(req: Request, res: Response, _next: NextFunction) {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    const { page, limit } = validateSchema(TherapistQuerySchema, req.query);
    const faqs = await therapistService.getTherapistFaqs(therapistId, { page, limit });

    return new OkResponse(faqs).send(res);
  }

  async getTherapistAvailability(req: Request, res: Response, _next: NextFunction) {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    const availability = await therapistService.getTherapistAvailability(therapistId);

    return new OkResponse(availability).send(res);
  }
}

export const therapistController = new TherapistController();
