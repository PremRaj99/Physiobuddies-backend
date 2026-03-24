import { Router } from 'express';
import therapistArticleController from './therapistArticle.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { TherapistOnly } from '@/core/middlewares/verifyTherapist';

export const therapistArticleRouter = Router();

therapistArticleRouter.use(verifyJWT);
therapistArticleRouter.use(TherapistOnly);

therapistArticleRouter.post('/', therapistArticleController.createArticle);
therapistArticleRouter.patch('/:id', therapistArticleController.updateArticle);
therapistArticleRouter.delete('/:id', therapistArticleController.deleteArticle);
