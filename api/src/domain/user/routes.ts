import { Router } from 'express';
import { isAuth } from '../auth/middleware';
import { user_controller } from './controller';

function userRoutes(router: Router) {
  router.get('/user/profile', isAuth, user_controller.getMyProfile);
  router.put('/user/password', isAuth, user_controller.updateMyPassword);
}
export default userRoutes;
