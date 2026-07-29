/**
 * Extracts creation timestamp from MongoDB ObjectId hex string.
 */
export const getTimestampFromObjectId = (id: string): Date => {
  try {
    const timestamp = parseInt(id.substring(0, 8), 16) * 1000;
    return new Date(timestamp);
  } catch {
    return new Date();
  }
};
