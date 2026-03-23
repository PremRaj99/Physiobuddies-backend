import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { NextFunction, Request, Response } from 'express';
import adminUserService from './adminUser.service';
import { validateSchema } from '@/core/utils/validateSchema';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';

class AdminUserController {
  getAllUsers = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const users = await adminUserService.getAllUsers();
    return new OkResponse(users).send(res);
  });

  blockUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = validateSchema(ObjectIdSchema, req.params.id);
    const message = await adminUserService.blockUser(userId);
    return new AcceptedResponse(message).send(res);
  });
}

export default new AdminUserController();
