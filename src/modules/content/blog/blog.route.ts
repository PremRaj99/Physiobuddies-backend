import { Router } from 'express';
import { blogController } from './blog.controller';
import { verifyJWT } from '@/core/middlewares/verifyJWT';
import { AdminOnly } from '@/core/middlewares/verifyAdmin';

export const blogRouter = Router();

blogRouter.get('/admin/all', verifyJWT, AdminOnly, blogController.getAllBlogsForAdmin);
blogRouter.put('/admin/:id', verifyJWT, AdminOnly, blogController.updateBlog);

blogRouter.get('/', blogController.getAllBlogs);
blogRouter.get('/:slug', blogController.getBlogBySlug);

blogRouter.use(verifyJWT);

blogRouter.post('/:id/like', blogController.likeBlog);
blogRouter.post('/:id/review', blogController.createReview);

blogRouter.use(AdminOnly);

blogRouter.post('/', blogController.createBlog);
blogRouter.delete('/:id', blogController.deleteBlog);
