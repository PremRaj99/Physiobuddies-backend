import { AcceptedResponse, CreatedResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import { NextFunction, Request, Response } from 'express';
import { TherapistArticleSchema, UpdateTherapistArticleSchema } from './therapistArticle.type';
import therapistArticleService from './therapistArticle.service';
import { isAuth } from '@/core/middlewares/isAuth';
import { ObjectIdSchema } from '../../auth/auth.type';

class TherapistArticleController {
  createArticle = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const parseData = validateSchema(TherapistArticleSchema, req.body);
    const userId = req.user.id;
    await therapistArticleService.createArticle(parseData, userId);
    return new CreatedResponse('Article created successfully').send(res);
  });

  updateArticle = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const articleId = validateSchema(ObjectIdSchema, req.params.id);
    const userId = req.user.id;
    const updateData = validateSchema(UpdateTherapistArticleSchema, req.body);
    await therapistArticleService.updateArticle(articleId, updateData, userId);

    return new AcceptedResponse('Article updated successfully').send(res);
  });

  deleteArticle = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    isAuth(req);
    const articleId = validateSchema(ObjectIdSchema, req.params.id);
    const userId = req.user.id;

    await therapistArticleService.deleteArticle(articleId, userId);
    return new AcceptedResponse('Article deleted successfully').send(res);
  });
}

export default new TherapistArticleController();
