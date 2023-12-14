import { TRoleDocument } from '@modules/role/entities/role.entity';
import { RoleService } from '@modules/role/role.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PermissionGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector, private roleService: RoleService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );
    // #1: API not auth
    if (!permission) return true;

    // #2: Check auth
    const isAuth = await super.canActivate(context);
    if (!isAuth) {
      Logger.error('User can not active context');
      throw new ForbiddenException({ message: 'User can not active context' });
    }

    // #2.1: Accepted for all users
    if (permission.length === 0 && isAuth) return true;

    // #2.2: Accepted user by permission
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // #2.2.1: Check status user
    if (!user?.isActive) {
      Logger.error('User does is locked:', user);
      throw new ForbiddenException({ message: 'User does is locked!' });
    }

    // #2.2.2: Check user verify (if)
    // [TODO] Check emailVerify, PhoneVerify, ...

    // #2.2.2: Check user role
    const roleIds =
      user?.roles?.length > 0
        ? user.roles
            .map((role: TRoleDocument) => role._id.toHexString())
            .filter((r: string) => !!r)
        : [];
    if (roleIds?.length <= 0) {
      throw new ForbiddenException({
        message: 'User does not have any permission!',
      });
    }

    const rolesCurrent = await this.roleService.findAllInIds(roleIds);
    if (rolesCurrent?.length <= 0) {
      throw new ForbiddenException({
        message: 'User have roles, but those roles do not exist in database!',
      });
    }

    const permissionCurrent = rolesCurrent
      .map((role) => role.permissions)
      .flat();

    const isValid = permissionCurrent.some((v) => {
      return permission.includes(v);
    });
    if (!isValid) {
      throw new ForbiddenException({
        message: 'User does not have any permission!',
      });
    }

    return true;
  }
}
