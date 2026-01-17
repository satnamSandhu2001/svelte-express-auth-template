import jwt from 'jsonwebtoken';
import { API } from './api';
import { CookieOptions, Response } from 'express';
import { appConfig } from './config';

export const generateToken = (
  type: 'ACCESS' | 'REFRESH',
  userId: number
): string => {
  const jwtSecret =
    type === 'ACCESS'
      ? (appConfig.JWT_SECRET as string)
      : (appConfig.REFRESH_TOKEN_SECRET as string);
  if (!jwtSecret) {
    throw new Error('Missing JWT_SECRET env variable');
  }

  const jwtExpiresIn: any = appConfig.TOKEN_EXPIRES_IN ?? '7';
  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: (jwtExpiresIn + 'd') as any,
  });
};

export const sendAccessToken = (
  res: Response,
  userId: number,
  message: string,
  data?: any
) => {
  let accessToken = generateToken('ACCESS', userId);
  let refreshToken = generateToken('REFRESH', userId);
  const isProd = appConfig.NODE_ENV === 'production';

  const baseOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
    domain: appConfig.COOKIE_DOMAIN,
  };

  const accessTokenOptions: CookieOptions = {
    ...baseOptions,
    maxAge: appConfig.TOKEN_EXPIRES_IN * 24 * 60 * 60 * 1000,
  };
  const refreshTokenOptions: CookieOptions = {
    ...baseOptions,
    maxAge: appConfig.REFRESH_TOKEN_EXPIRES_IN * 24 * 60 * 60 * 1000,
  };

  res.cookie('accessToken', accessToken, accessTokenOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenOptions);
  API.success(res, message, { ...data });
};
