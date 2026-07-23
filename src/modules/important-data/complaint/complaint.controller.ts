import { OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import { isAuth } from '@/core/middlewares/isAuth';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { complaintService } from './complaint.service';
import { CreateComplaintSchema } from './complaint.type';

class ComplaintController {
  getUserComplaints = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const isAdmin = req.user.role === 'admin';
    const complaints = await complaintService.getUserComplaints(req.user.id, isAdmin);
    return new OkResponse(complaints).send(res);
  });

  createComplaint = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const data = validateSchema(CreateComplaintSchema, req.body);
    const complaint = await complaintService.createComplaint(req.user.id, data);
    return new OkResponse(complaint).send(res);
  });

  addReply = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const complaintId = validateSchema(ObjectIdSchema, req.params.id);
    const message = req.body.message || req.body.text;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Reply text/message is required' });
    }
    const role = req.user.role === 'admin' ? 'support' : 'user';
    const reply = await complaintService.addReply(req.user.id, complaintId, message, role);
    return new OkResponse(reply).send(res);
  });
}

export const complaintController = new ComplaintController();
