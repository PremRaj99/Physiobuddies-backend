class SessionReviewService {
  async submitReview(_sessionId: string, _reviewData: unknown) {
    // Logic to submit a review for a session
  }

  async getReviews(_sessionId: string) {
    // Logic to get reviews for a session
    return [];
  }
}

export default new SessionReviewService();
