import { Router } from "express";
import adminUserController from "./adminUser.controller";

export const adminUserRouter = Router();

adminUserRouter.get("/", adminUserController.getAllUsers);
adminUserRouter.patch("/:id/block", adminUserController.blockUser);