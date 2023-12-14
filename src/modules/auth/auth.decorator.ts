import { TUserDocument } from '@modules/user/entities/user.entity';
import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export const Permission = (...permission: string[]) => {
  return applyDecorators(
    ApiBearerAuth(),
    SetMetadata('permission', permission),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
};

export const Auth = (...permission: string[]) => {
  return applyDecorators(
    ApiBearerAuth(),
    SetMetadata('permission', permission),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
};

export const AuthUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user && user[data] : user;
  },
);
