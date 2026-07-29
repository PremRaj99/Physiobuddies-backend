/**
 * Safely parses a JSON log line into an object fallback to a plain message object.
 */
export const parseLogLine = (line: string): unknown => {
  try {
    return JSON.parse(line);
  } catch {
    return { message: line };
  }
};
