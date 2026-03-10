export const generateTherapistId = () => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 8);
  return `THER-${timestamp}-${randomString}`.toUpperCase();
};

export const generatePatientId = () => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 8);
  return `PAT-${timestamp}-${randomString}`.toUpperCase();
};
