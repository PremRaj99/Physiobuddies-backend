import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import { BlockSlotsSchema, UpdateWeeklyScheduleSchema } from './slotBlock.type';
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

  getWeeklySchedule = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const result = await slotBlockService.getWeeklySchedule(req.user.id);
    return new OkResponse(result).send(res);
  });

  updateWeeklySchedule = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const body = validateSchema(UpdateWeeklyScheduleSchema, req.body);
    const result = await slotBlockService.updateWeeklySchedule(req.user.id, body);
    return new OkResponse(result).send(res);
  });

  getBlocksAndLeaves = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const dateStr = req.query.date as string;
    if (!dateStr) {
      return res.status(400).json({ message: 'Date query parameter is required' });
    }
    const result = await slotBlockService.getBlocksAndLeaves(req.user.id, dateStr);
    return new OkResponse(result).send(res);
  });

  getOverrides = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const result = await slotBlockService.getOverrides(req.user.id);
    return new OkResponse(result).send(res);
  });
}

export default new SlotBlockController();
