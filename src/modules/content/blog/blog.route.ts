import { Router } from 'express';
import { blogController } from './blog.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { AdminOnly } from '@/core/middlewares/verifyAdmin';

export const blogRouter = Router();

blogRouter.get('/', blogController.getAllBlogs);
blogRouter.get('/:slug', blogController.getBlogBySlug);

blogRouter.use(verifyJWT);

blogRouter.post('/:id/like', blogController.likeBlog);
blogRouter.post('/:id/review', blogController.createReview);

blogRouter.use(AdminOnly);

blogRouter.post('/', blogController.createBlog);
blogRouter.get('/admin/all', blogController.getAllBlogsForAdmin);
blogRouter.put('/admin/:id', blogController.updateBlog);
blogRouter.delete('/:id', blogController.deleteBlog);
