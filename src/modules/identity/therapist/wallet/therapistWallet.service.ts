class TherapistWalletService {
    async getWalletInfo(therapistId: string) {
        // Fetch wallet info from database
        const walletInfo = {
            balance: 1000, // Example balance
        };
        if (!walletInfo) {
            throw new Error("Wallet not found");
        }
        return walletInfo;
    }
}

export default new TherapistWalletService();