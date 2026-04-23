import jwt from 'jsonwebtoken';
import { CookieOptions, Response } from 'express';
import { appConfig } from './config';

export const generateToken = (
  type: 'ACCESS' | 'REFRESH',
  userId: number
): string => {
  const jwtSecret =
    type === 'ACCESS' ? appConfig.JWT_SECRET : appConfig.REFRESH_TOKEN_SECRET;

  const expiresIn =
    type === 'ACCESS'
      ? appConfig.TOKEN_EXPIRES_IN
      : appConfig.REFRESH_TOKEN_EXPIRES_IN;

  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: (expiresIn + 'd') as any,
  });
};

export const attachAccessTokensToResponse = (
  res: Response,
  sendTokens: ('ACCESS' | 'REFRESH')[],
  userId: number
) => {
  let accessToken = null;
  let refreshToken = null;

  if (sendTokens.includes('ACCESS'))
    accessToken = generateToken('ACCESS', userId);
  if (sendTokens.includes('REFRESH'))
    refreshToken = generateToken('REFRESH', userId);

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

  if (accessToken) res.cookie('accessToken', accessToken, accessTokenOptions);
  if (refreshToken)
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);
};
