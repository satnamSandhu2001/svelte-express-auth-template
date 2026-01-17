import { API } from '#/lib/api';
import { appConfig } from '#/lib/config';
import prisma from '#/lib/database';
import logger from '#/lib/logger';
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
    const token = req.cookies?.accessToken;
    if (!token) {
      API.unauthorized(res);
      return;
    }

    const decoded = jwt.verify(token, appConfig.JWT_SECRET) as any;
    const user = await prisma.user.findFirst({
      where: { id: decoded.id },
      omit: { password: true },
    });

    if (!user || !user.isActive) {
      API.unauthorized(res, 'Invalid token or user is unauthorized');
      return;
    }
    if (!user || !user.isActive) {
      API.unauthorized(res, 'Invalid token or user is unauthorized');
      return;
    }

    req.user = user;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    API.internalServerError(res);
  }
};
