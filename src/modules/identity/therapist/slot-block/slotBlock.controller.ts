import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import { BlockSlotsSchema } from './slotBlock.type';
import slotBlockService from './slotBlock.service';
import { OkResponse } from '@/core/response/ApiResponse';
import { isAuth } from '@/core/middlewares/isAuth';

class SlotBlockController {
  blockSlots = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const body = validateSchema(BlockSlotsSchema, req.body);
    const result = await slotBlockService.blockSlots(body, req.user.id);
    return new OkResponse(result).send(res);
  });

  unblockSlots = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const body = validateSchema(BlockSlotsSchema, req.body);
    const result = await slotBlockService.unblockSlots(body, req.user.id);
    return new OkResponse(result).send(res);
  });
}

export default new SlotBlockController();
