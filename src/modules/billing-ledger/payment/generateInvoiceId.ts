export const generateInvoiceId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp}-${randomString}`;
};
