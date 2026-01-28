import { API } from '#/lib/api';
import { appConfig } from '#/lib/config';
import prisma from '#/lib/database';
import logger from '#/lib/logger';
import { attachAccessTokensToResponse } from '#/lib/cookies';
import { User } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: Omit<User, 'password'>;
}

export const isAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;
    // If no access token, check if refresh token exists
    if (!accessToken) {
      if (!refreshToken) {
        return API.unauthorized(res, 'User not authenticated');
      }

      // Try to refresh the access token
      return handleTokenRefresh(req, res, next, refreshToken);
    }

    // Verify access token
    try {
      const decoded = jwt.verify(accessToken, appConfig.JWT_SECRET) as any;
      const user = await prisma.user.findFirst({
        where: { id: decoded.id },
        omit: { password: true },
      });

      if (!user || !user.isActive) {
        return API.unauthorized(res, 'Invalid token or user is unauthorized');
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Access token expired, try to refresh
        if (!refreshToken) {
          return API.unauthorized(
            res,
            'Authentication expired, please log in again'
          );
        }
        return handleTokenRefresh(req, res, next, refreshToken);
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return API.unauthorized(res, 'Invalid access token');
      }

      throw error;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return API.internalServerError(res);
  }
};

async function handleTokenRefresh(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  refreshToken: string
) {
  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      appConfig.REFRESH_TOKEN_SECRET
    ) as any;
    logger.info('Refreshing access token for user: ', decoded);

    // Find user
    const user = await prisma.user.findFirst({
      where: { id: decoded.id },
      omit: { password: true },
    });

    if (!user || !user.isActive) {
      return API.unauthorized(
        res,
        'Invalid refresh token or user is unauthorized'
      );
    }

    attachAccessTokensToResponse(res, ['ACCESS'], user.id);

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return API.unauthorized(res, 'Refresh token expired. Please login again');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return API.unauthorized(res, 'Invalid refresh token');
    }

    logger.error('Token refresh error in middleware:', error);
    return API.internalServerError(res);
  }
}

/**
  Strict Validates only the access token from cookies. Does NOT attempt to refresh
  if the token is expired. used in sensitive operations like `deleting-account`
 */
export const isAuthStrict = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return API.unauthorized(res);
    }

    const decoded = jwt.verify(token, appConfig.JWT_SECRET) as any;
    const user = await prisma.user.findFirst({
      where: { id: decoded.id },
      omit: { password: true },
    });

    if (!user || !user.isActive) {
      return API.unauthorized(res, 'Invalid token or user is unauthorized');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return API.unauthorized(res, 'Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return API.unauthorized(res, 'Invalid access token');
    }

    logger.error('Authentication error:', error);
    return API.internalServerError(res);
  }
};
