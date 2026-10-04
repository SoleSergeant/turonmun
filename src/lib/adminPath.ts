/**
 * Builds an admin-panel link. On the real admin.* subdomain paths are used
 * as-is; anywhere else (localhost, previews) the admin route tree is
 * selected with ?subdomain=admin, so it has to be carried on every link.
 */
export const isAdminHost = () => window.location.hostname.startsWith('admin.');

export const adminPath = (path: string) => {
  if (isAdminHost()) return path;
  return `${path}${path.includes('?') ? '&' : '?'}subdomain=admin`;
};
