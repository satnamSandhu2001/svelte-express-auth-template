import { Router } from 'express';
import { auth_controller } from './controller';

function authRoutes(router: Router) {
  router.post('/auth/signup', auth_controller.signup);
  router.post('/auth/login', auth_controller.login);
  router.post('/auth/refresh', auth_controller.refresh);
  router.get('/auth/logout', auth_controller.logout);
}
export default authRoutes;
