class TherapistSessionService {
  async getTodaySessions(_therapistId: string) {
    // Logic to fetch today's sessions for the therapist
    return [];
  }

  async getUpcomingSessions(_therapistId: string) {
    // Logic to fetch upcoming sessions for the therapist
    return [];
  }
}

export const therapistSessionService = new TherapistSessionService();
