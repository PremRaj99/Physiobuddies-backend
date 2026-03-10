import { Router } from "express";
import therapistArticleController from "./therapistArticle.controller";

export const therapistArticleRouter = Router();

therapistArticleRouter.post("/", therapistArticleController.createArticle);
therapistArticleRouter.patch("/:id", therapistArticleController.updateArticle);
therapistArticleRouter.delete("/:id", therapistArticleController.deleteArticle);