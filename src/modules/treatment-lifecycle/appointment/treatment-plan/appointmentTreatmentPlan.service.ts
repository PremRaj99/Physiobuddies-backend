class AppointmentTreatmentPlanService {
  async createOrUpdateTreatmentPlan(_appointmentId: string, _treatmentPlanData: unknown) {
    // Logic to create or update treatment plan for the given appointment
  }

  async addSessionToTreatmentPlan(_appointmentId: string, _sessionId: string) {
    // Logic to add a session to the treatment plan for the given appointment
  }
}

export default new AppointmentTreatmentPlanService();
