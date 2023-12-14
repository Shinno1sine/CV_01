import { permissions } from '@configs/permission.config';

export const permissionToFlat = () => {
  return permissions.map((p) => p.permissions).flat();
};
