import { Router } from 'express';
import { therapistController } from './therapist.controller';
import { therapistArticleRouter } from './article/therapistArticle.route';
import { therapistEarningRouter } from './earning/therapistEarning.route';
import { therapistFaqRouter } from './faq/therapistFaq.route';
import { therapistPayoutRouter } from './payout/therapistPayout.route';
import { therapistWalletRouter } from './wallet/therapistWallet.route';
import { therapistSessionRouter } from './session/therapistSession.route';

export const therapistRouter = Router();

therapistRouter.use('/articles', therapistArticleRouter);
therapistRouter.use('/earnings', therapistEarningRouter);
therapistRouter.use('/faqs', therapistFaqRouter);
therapistRouter.use('/payout', therapistPayoutRouter);
therapistRouter.use('/sessions', therapistSessionRouter);
therapistRouter.use('/wallet', therapistWalletRouter);

therapistRouter.get('/', therapistController.getAllTherapists);
therapistRouter.get('/:id', therapistController.getTherapistById);
therapistRouter.get('/:id/reviews', therapistController.getTherapistReviews);
therapistRouter.get('/:id/articles', therapistController.getTherapistArticles);
therapistRouter.get('/:id/faqs', therapistController.getTherapistFaqs);
therapistRouter.get('/:id/availability', therapistController.getTherapistAvailability);
