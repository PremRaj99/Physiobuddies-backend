import { Router } from 'express';
import { appointmentController } from './appointment.controller';

export const appointmentRouter = Router();

appointmentRouter.post('/', appointmentController.createAppointment);
appointmentRouter.get('/', appointmentController.listAppointments);
appointmentRouter.get('/:id', appointmentController.getAppointmentById);
appointmentRouter.patch('/:id/cancel', appointmentController.cancelAppointment);
