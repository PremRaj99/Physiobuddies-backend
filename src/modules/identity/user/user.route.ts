import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { Router } from 'express';
import { userController } from './user.controller';

const { getInfo, updateInfo, updateAvatar, changePassword } = userController;

export const userRouter = Router();

userRouter.use(verifyJWT);
userRouter.get('/', getInfo);
userRouter.patch('/', updateInfo);
userRouter.patch('/avatar', updateAvatar);
userRouter.patch('/password', changePassword);
