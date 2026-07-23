import { OkResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import type { NextFunction, Request, Response } from 'express';
import { ObjectIdSchema } from '../auth/auth.type';
import { therapistService } from './therapist.service';
import { TherapistQuerySchema } from './therapist.type';

import { isAuth } from '@/core/middlewares/isAuth';

class TherapistController {
  async getTherapistDashboard(req: Request, res: Response, _next: NextFunction) {
    isAuth(req);
    const dashboardData = await therapistService.getDashboardData(req.user.id);
    return new OkResponse(dashboardData).send(res);
  }
  async getAllTherapists(req: Request, res: Response, _next: NextFunction) {
    const query = validateSchema(TherapistQuerySchema, req.query);
    const therapists = await therapistService.getAllTherapists(query);

    return new OkResponse(therapists).send(res);
  }

  async getTherapistById(req: Request, res: Response, _next: NextFunction) {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    const { lat, lng } = validateSchema(TherapistQuerySchema, req.query);
    const location = {
      ...(lat !== undefined && { lat: Number(lat) }),
      ...(lng !== undefined && { lng: Number(lng) }),
    };

    const therapist = await therapistService.getTherapistById(therapistId, location);

    return new OkResponse(therapist).send(res);
  }

  async getTherapistReviews(req: Request, res: Response, _next: NextFunction) {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    const { page, limit } = validateSchema(TherapistQuerySchema, req.query);

    const pagination = {
      ...(page !== undefined && { page }),
      ...(limit !== undefined && { limit }),
    };

    const reviews = await therapistService.getTherapistReviews(therapistId, pagination);

    return new OkResponse(reviews).send(res);
  }

  async getTherapistArticles(req: Request, res: Response, _next: NextFunction) {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    const { page, limit } = validateSchema(TherapistQuerySchema, req.query);

    const pagination = {
      ...(page !== undefined && { page }),
      ...(limit !== undefined && { limit }),
    };

    const articles = await therapistService.getTherapistArticles(therapistId, pagination);

    return new OkResponse(articles).send(res);
  }

  async getTherapistFaqs(req: Request, res: Response, _next: NextFunction) {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    const { page, limit } = validateSchema(TherapistQuerySchema, req.query);

    const pagination = {
      ...(page !== undefined && { page }),
      ...(limit !== undefined && { limit }),
    };

    const faqs = await therapistService.getTherapistFaqs(therapistId, pagination);

    return new OkResponse(faqs).send(res);
  }

  async getTherapistAvailability(req: Request, res: Response, _next: NextFunction) {
    const therapistId = validateSchema(ObjectIdSchema, req.params.id);
    const availability = await therapistService.getTherapistAvailability(therapistId);

    return new OkResponse(availability).send(res);
  }
}

export const therapistController = new TherapistController();
