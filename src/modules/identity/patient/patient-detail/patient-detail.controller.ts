import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import type { NextFunction, Request, Response } from 'express';
import { PatientDetailsSchema } from '../patient.type';
import { patientDetailService } from './patient-detail.service';
import { isAuth } from '@/core/middlewares/isAuth';
import { ObjectIdSchema } from '../../auth/auth.type';
import { AcceptedResponse, CreatedResponse, OkResponse } from '@/core/response/ApiResponse';

class PatientDetailController {
  // Implement patient detail-specific endpoints here
  createPatientDetail = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Placeholder for create patient detail endpoint logic
    isAuth(req);
    const parseData = validateSchema(PatientDetailsSchema, req.body);

    await patientDetailService.createPatientDetail(req.user.id, parseData);
    res.status(201).json(new CreatedResponse('Patient detail created successfully'));
  });

  getPatientDetails = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Placeholder for get patient details endpoint logic
    isAuth(req);
    const patientDetails = await patientDetailService.getPatientDetails(req.user.id);
    res.json(new OkResponse(patientDetails));
  });

  updatePatientDetail = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Placeholder for update patient detail endpoint logic
    const patientDetailId = validateSchema(ObjectIdSchema, req.params.id);
    isAuth(req);
    const parseData = validateSchema(PatientDetailsSchema, req.body);
    await patientDetailService.updatePatientDetail(patientDetailId, req.user.id, parseData);
    res.status(202).json(new AcceptedResponse('Patient detail updated successfully'));
  });

  deletePatientDetail = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Placeholder for delete patient detail endpoint logic
    const patientDetailId = validateSchema(ObjectIdSchema, req.params.id);
    isAuth(req);
    await patientDetailService.deletePatientDetail(patientDetailId, req.user.id);
    res.status(202).json(new AcceptedResponse('Patient detail deleted successfully'));
  });
}

export const patientDetailController = new PatientDetailController();
