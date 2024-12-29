export const normalizeOrgId = (url: string) => {
  return url.replace(/[^a-zA-Z0-9]/g, '_');
};