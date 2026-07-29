/**
 * Computes the toggled status of a user (active <-> blocked).
 */
export const getToggledUserStatus = (currentStatus: string): 'active' | 'blocked' => {
  return currentStatus === 'blocked' ? 'active' : 'blocked';
};

/**
 * Builds user status toggle message.
 */
export const formatUserBlockResponseMessage = (
  userName: string | null,
  nextStatus: 'active' | 'blocked',
): string => {
  const name = userName || 'User';
  const actionText = nextStatus === 'blocked' ? 'blocked' : 'unblocked';
  return `${name} has been ${actionText} successfully.`;
};
