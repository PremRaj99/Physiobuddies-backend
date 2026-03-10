import type { NextFunction, Request, Response } from 'express';

class BlogController {
  async createBlog(req: Request, res: Response, next: NextFunction) { }

  async getAllBlogs(req: Request, res: Response, next: NextFunction) { }

  async getBlogBySlug(req: Request, res: Response, next: NextFunction) { }

  async likeBlog(req: Request, res: Response, next: NextFunction) { }

  async createReview(req: Request, res: Response, next: NextFunction) { }

  async getAllBlogsForAdmin(req: Request, res: Response, next: NextFunction) { }

  async updateBlog(req: Request, res: Response, next: NextFunction) { }

  async deleteBlog(req: Request, res: Response, next: NextFunction) { }
}

export const blogController = new BlogController();
