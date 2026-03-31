import { asyncHandler } from '@/core/response/responseHandler';
import { userService } from './user.service';
import { isAuth } from '@/core/middlewares/isAuth';
import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { validateSchema } from '@/core/utils/validateSchema';
import { ChangePasswordSchema, UpdateAvatarSchema, UpdateUserSchema } from './user.type';

class UserController {
  getInfo = asyncHandler(async (req, res, _next) => {
    // Implementation for getting user information
    isAuth(req);

    const user = await userService.getInfo(req.user.id);
    return new OkResponse(user).send(res);
  });

  updateInfo = asyncHandler(async (req, res, _next) => {
    // Implementation for updating user information
    isAuth(req);

    const parseData = validateSchema(UpdateUserSchema, req.body);

    await userService.updateInfo(req.user.id, parseData);
    return new AcceptedResponse('User information updated successfully').send(res);
  });

  updateAvatar = asyncHandler(async (req, res, _next) => {
    // Implementation for updating user avatar

    isAuth(req);

    const parseData = validateSchema(UpdateAvatarSchema, req.body);
    await userService.updateAvatar(req.user.id, parseData);
    return new AcceptedResponse('User avatar updated successfully').send(res);
  });

  changePassword = asyncHandler(async (req, res, _next) => {
    // Implementation for changing user password

    isAuth(req);

    const parseData = validateSchema(ChangePasswordSchema, req.body);
    await userService.changePassword(req.user.id, parseData);
    return new AcceptedResponse('User password changed successfully').send(res);
  });
}

export const userController = new UserController();
