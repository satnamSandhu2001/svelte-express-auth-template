import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import logger from '#/lib/logger';
import prisma from '#/lib/database';
import { API } from '#/lib/api';
import { attachAccessTokensToResponse } from '#/lib/cookies';
import { auth_schema } from './schema';
import { validatePayload } from '#/lib/validators';
import { appConfig } from '#/lib/config';
import jwt from 'jsonwebtoken';

export const auth_controller = {
  signup: async (req: Request, res: Response) => {
    try {
      const payload = validatePayload(auth_schema.login_schema, req.body);
      if (!payload.success)
        return API.validationError(res, 'Invalid request data', payload.errors);

      const { email, password } = payload.data;
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser)
        return API.error(res, 'User already exists with this email');

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
        },
      });

      logger.info(`User registered: ${user.email}`);
      attachAccessTokensToResponse(res, ['ACCESS', 'REFRESH'], user.id);

      return API.success(res, 'User registered successfully', {
        user,
      });
    } catch (error) {
      logger.error('signup error:', error);
      API.internalServerError(res);
    }
  },

  // POST /api/auth/login
  login: async (req: Request, res: Response) => {
    try {
      const payload = validatePayload(auth_schema.login_schema, req.body);
      if (!payload.success)
        return API.validationError(
          res,
          'Invalid data submitted',
          payload.errors
        );

      const { email, password } = payload.data;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return API.error(res, 'Invalid credentials');
      if (!user.isActive) return API.error(res, 'User not authorized');

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) return API.error(res, 'Invalid credentials');

      user.password = ''; // remove password from response

      attachAccessTokensToResponse(res, ['ACCESS', 'REFRESH'], user.id);

      return API.success(res, 'Logged in successfully', {
        user,
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },

  // POST /api/auth/refresh
  refresh: async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return API.unauthorized(res, 'Refresh token not found');
      }

      // Verify refresh token
      let decoded: any;
      try {
        decoded = jwt.verify(refreshToken, appConfig.REFRESH_TOKEN_SECRET);
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          return API.unauthorized(res, 'Refresh token expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
          return API.unauthorized(res, 'Invalid refresh token');
        }
        throw error;
      }

      // Find user
      const user = await prisma.user.findFirst({
        where: { id: decoded.id },
        omit: { password: true },
      });

      if (!user || !user.isActive) {
        return API.unauthorized(
          res,
          'User not found or is not authorized to access this resource'
        );
      }

      // Generate new tokens
      attachAccessTokensToResponse(res, ['ACCESS', 'REFRESH'], user.id);
      return API.success(res, 'Token refreshed successfully', {
        user,
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      return API.internalServerError(res, 'Failed to refresh token');
    }
  },

  // GET /api/auth/logout
  logout: async (_: Request, res: Response) => {
    try {
      API.removeAuthTokens(res);
    } catch (error) {
      logger.error('Logout error:', error);
      API.internalServerError(res);
    }
  },
};
