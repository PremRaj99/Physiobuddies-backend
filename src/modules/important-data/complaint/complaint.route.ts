import { Router } from 'express';
import { complaintController } from './complaint.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';

export const complaintRouter = Router();

complaintRouter.use(verifyJWT);

complaintRouter.get('/', complaintController.getUserComplaints);
complaintRouter.post('/', complaintController.createComplaint);
complaintRouter.post('/:id/reply', complaintController.addReply);
