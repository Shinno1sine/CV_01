import { ERole } from '@configs/permission.config';
import { Role } from '../entities/role.entity';

export const ROLE_ADMIN: Role = {
  code: ERole.ADMINISTRATOR,
  description: 'The user with the highest authority in the system',
  permissions: [],
  isActive: true,
};

export const ROLE_GUEST: Role = {
  code: ERole.GUEST,
  description: 'Is the guest user of the system',
  permissions: [],
  isActive: true,
};

export const ROLE_EDITOR: Role = {
  code: ERole.EDITOR,
  description: 'Is the editor user of the system',
  permissions: [],
  isActive: true,
};
