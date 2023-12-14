import { isSlug } from '@utils/string.util';
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsSlug(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsSlug',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return isSlug(value);
        },
        defaultMessage() {
          return `${propertyName} Invalid!`;
        },
      },
    });
  };
}
