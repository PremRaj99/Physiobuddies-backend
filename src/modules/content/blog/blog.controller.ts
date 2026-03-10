import type { NextFunction, Request, Response } from 'express';

class BlogController {
  async createBlog(_req: Request, _res: Response, _next: NextFunction) {}

  async getAllBlogs(_req: Request, _res: Response, _next: NextFunction) {}

  async getBlogBySlug(_req: Request, _res: Response, _next: NextFunction) {}

  async likeBlog(_req: Request, _res: Response, _next: NextFunction) {}

  async createReview(_req: Request, _res: Response, _next: NextFunction) {}

  async getAllBlogsForAdmin(_req: Request, _res: Response, _next: NextFunction) {}

  async updateBlog(_req: Request, _res: Response, _next: NextFunction) {}

  async deleteBlog(_req: Request, _res: Response, _next: NextFunction) {}
}

export const blogController = new BlogController();
