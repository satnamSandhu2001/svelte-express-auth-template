import { API } from '#/lib/api';
import { Response } from 'express';
import logger from '#/lib/logger';
import { AuthRequest } from '../auth/middleware';
import { user_schema } from './schema';
import prisma from '#/lib/database';
import bcrypt from 'bcryptjs';
import { validatePayload } from '#/lib/validators';

export const user_controller = {
  // GET /user/profile
  getMyProfile: async (req: AuthRequest, res: Response) => {
    try {
      return API.success(res, 'Profile fetched successfully', {
        user: req.user,
      });
    } catch (error) {
      logger.error('Get my profile error:', error);
      API.internalServerError(res);
    }
  },

  // PUT /user/password
  updateMyPassword: async (req: AuthRequest, res: Response) => {
    try {
      const validate = validatePayload(user_schema.change_password, req.body);
      if (!validate.success)
        return API.validationError(
          res,
          'Invalid request data',
          validate.errors
        );
      const { new_password, old_password } = validate.data;

      const user = await prisma.user.findFirst({
        where: { id: req.user?.id as number },
      });

      if (!user) return API.error(res, 'User not found');

      const isValidPassword = bcrypt.compareSync(old_password, user.password);
      if (!isValidPassword) return API.error(res, 'Invalid old password');

      const newPassHash = bcrypt.hashSync(new_password, 10);

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: newPassHash,
        },
      });

      return API.removeAuthTokens(res, 'Password updated successfully');
    } catch (error) {
      logger.error('Get my profile error:', error);
      API.internalServerError(res);
    }
  },
};
