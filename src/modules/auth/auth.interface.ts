export interface IResAuth {
  accessToken: string;
  expiredAt: number;
  refreshToken: string;
  expiredAtRefreshToken: number;
  email: string;
  phone: string;
}

export type TPayloadJwt = {
  _id: string;
  email: string;
  phone: string;
  lastName: string;
  firstName: string;
};
