class SessionService {
  async startSession(_sessionId: string) {
    // Logic to start a session
  }

  async completeSession(_sessionId: string) {
    // Logic to complete a session
  }
  async markNoShow(_sessionId: string) {
    // Logic to mark a session as no-show
  }

  async cancelSession(_sessionId: string) {
    // Logic to cancel a session
  }
}

export default new SessionService();
