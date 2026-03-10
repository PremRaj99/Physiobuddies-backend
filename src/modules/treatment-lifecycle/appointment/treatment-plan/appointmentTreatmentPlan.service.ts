class AppointmentTreatmentPlanService {
    async createOrUpdateTreatmentPlan(appointmentId: string, treatmentPlanData: any) {
        // Logic to create or update treatment plan for the given appointment
    }

    async addSessionToTreatmentPlan(appointmentId: string, sessionId: string) {
        // Logic to add a session to the treatment plan for the given appointment
    }

}

export default new AppointmentTreatmentPlanService();