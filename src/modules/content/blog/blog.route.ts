import { Router } from 'express';
import { blogController } from './blog.controller';

export const blogRouter = Router();

blogRouter.post('/', blogController.createBlog);
blogRouter.get('/', blogController.getAllBlogs);
blogRouter.get('/:slug', blogController.getBlogBySlug);
blogRouter.post('/:id/like', blogController.likeBlog);
blogRouter.post('/:id/review', blogController.createReview);

blogRouter.get('/admin/all', blogController.getAllBlogsForAdmin);
blogRouter.put('/admin/:id', blogController.updateBlog);
blogRouter.delete('/:id', blogController.deleteBlog);
