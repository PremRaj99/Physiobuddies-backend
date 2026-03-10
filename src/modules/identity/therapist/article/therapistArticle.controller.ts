import { AcceptedResponse, CreatedResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { NextFunction, Request, Response } from 'express';

class TherapistArticleController {
  createArticle = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    // Logic to create a new article
    res.status(201).json(new CreatedResponse('Article created successfully'));
  });

  updateArticle = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    // Logic to update an existing article by id
    res.status(202).json(new AcceptedResponse('Article updated successfully'));
  });

  deleteArticle = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    // Logic to delete an article by id
    res.status(202).json(new AcceptedResponse('Article deleted successfully'));
  });
}

export default new TherapistArticleController();
