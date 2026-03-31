import { asyncHandler } from '@/core/response/responseHandler';
import therapistWalletService from './therapistWallet.service';
import { OkResponse } from '@/core/response/ApiResponse';
import { isAuth } from '@/core/middlewares/isAuth';

class TherapistWalletController {
  getWalletInfo = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const therapistId = req.user.id; // Assuming therapist ID is available in the authenticated user object
    const walletInfo = await therapistWalletService.getWalletInfo(therapistId);
    return new OkResponse(walletInfo).send(res);
  });
}

export default new TherapistWalletController();
