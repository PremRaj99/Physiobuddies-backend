class TherapistSessionService {
    async getTodaySessions(therapistId: string) {
        // Logic to fetch today's sessions for the therapist
    } 

    async getUpcomingSessions(therapistId: string) {
        // Logic to fetch upcoming sessions for the therapist
    }

}

export const therapistSessionService = new TherapistSessionService();