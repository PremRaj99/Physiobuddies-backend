import { OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { isAuth } from '@/core/middlewares/isAuth';
import { activityService } from './activity.service';

class ActivityController {
  getUserActivities = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const activities = await activityService.getUserActivities(req.user.id, req.user.role);
    return new OkResponse(activities).send(res);
  });
}

export const activityController = new ActivityController();
