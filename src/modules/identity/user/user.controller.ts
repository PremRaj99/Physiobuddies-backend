import { asyncHandler } from '@/core/response/responseHandler';
import type { NextFunction, Request, Response } from 'express';
import { userService } from './user.service';
import { isAuth } from '@/core/middlewares/isAuth';
import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { ChangePasswordSchema, UpdateAvatarSchema, UpdateUserSchema } from './user.type';

class UserController {
  getInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for getting user information
    isAuth(req);

    const user = await userService.getInfo(req.user.id);
    res.json(new OkResponse(user));
  });

  updateInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for updating user information
    isAuth(req);

    const parseData = validateSchema(UpdateUserSchema, req.body);

    await userService.updateInfo(req.user.id, parseData);
    res.status(202).json(new AcceptedResponse('User information updated successfully'));
  });

  updateAvatar = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for updating user avatar

    isAuth(req);

    const parseData = validateSchema(UpdateAvatarSchema, req.body);
    await userService.updateAvatar(req.user.id, parseData);
    res.status(202).json(new AcceptedResponse('User avatar updated successfully'));
  });

  changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for changing user password

    isAuth(req);

    const parseData = validateSchema(ChangePasswordSchema, req.body);
    await userService.changePassword(req.user.id, parseData);
    res.status(202).json(new AcceptedResponse('User password changed successfully'));
  });
}

export const userController = new UserController();
