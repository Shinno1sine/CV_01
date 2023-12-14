import { BadRequestException } from '@nestjs/common';
import { isMongoId } from 'class-validator';

export const mongoObjectId = function () {
  const timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
  return (
    timestamp +
    'xxxxxxxxxxxxxxxx'
      .replace(/[x]/g, function () {
        return ((Math.random() * 16) | 0).toString(16);
      })
      .toLowerCase()
  );
};

export function mongoObjectIds(ids: string[]): boolean {
  if (ids?.length <= 0) return false;
  let result = true;
  ids.forEach((id) => {
    if (!isMongoId(id)) {
      result = false;
      return;
    }
  });
  return result;
}

export function checkMongoId(id: string, message?: string): void {
  if (id && !isMongoId(id)) {
    throw new BadRequestException({
      message: message || 'Id must be MongoId!',
    });
  }
}

export function checkMongoObjectIds(ids: string[], message?: string): void {
  if (ids && ids?.length > 0) {
    if (!Array.isArray(ids)) ids = [ids];
    const flag = mongoObjectIds(ids);
    if (!flag)
      throw new BadRequestException({
        message: message || 'Ids must be [mongoId]!',
      });
  }
}
