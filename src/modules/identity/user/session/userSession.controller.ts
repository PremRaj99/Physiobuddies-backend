import { AcceptedResponse, OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import { isAuth } from '@/core/middlewares/isAuth';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { userSessionService } from './userSession.service';

class UserSessionController {
  getSessions = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const currentRefreshToken = req.cookies?.refresh_token as string | undefined;
    const sessions = await userSessionService.getSessions(req.user.id, currentRefreshToken);
    return new OkResponse(sessions).send(res);
  });

  revokeSession = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const sessionId = validateSchema(ObjectIdSchema, req.params.id);
    await userSessionService.revokeSession(req.user.id, sessionId);
    return new AcceptedResponse('Session revoked successfully').send(res);
  });
}

export const userSessionController = new UserSessionController();
