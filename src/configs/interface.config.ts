export interface IRes<T = any> {
  data?: T;
  message: string;
  [key: string]: any;
}

export interface IResListData<T = any> extends IRes<T> {
  total: number;
  limit: number;
  page: number;
}

export enum EOrder {
  DESC = 'DESC',
  ASC = 'ASC',
}

export enum EOrderBy {
  ID = '_id',
  CREATED_DATE = 'createdAt',
  UPDATED_DATE = 'updatedAt',
  SCHEDULE_DATE = 'scheduleAt',
  USERNAME = 'username',
  NAME = 'name',
  NAME_SORT = 'nameSort',
  TITLE = 'title',
}

export enum EStatusDoc {
  ACTIVE = 'active', // Đang hoạt động
  DRAFT = 'draft', // Dự thảo or nháp
  INACTIVE = 'inactive', // Không hoạt động
  PENDING = 'pending', // Chờ phê duyệt
}
