import { AcceptedResponse, CreatedResponse, OkResponse } from '@/core/response/ApiResponse';
import { asyncHandler } from '@/core/response/responseHandler';
import { validateSchema } from '@/core/utils/validateSchema';
import { isAuth } from '@/core/middlewares/isAuth';
import { ObjectIdSchema } from '@/modules/identity/auth/auth.type';
import { blogService } from './blog.service';
import {
  CreateBlogSchema,
  CreateReviewSchema,
  ListBlogQuerySchema,
  UpdateBlogSchema,
} from './blog.type';

class BlogController {
  getAllBlogs = asyncHandler(async (req, res, _next) => {
    const query = validateSchema(ListBlogQuerySchema, req.query);
    const blogs = await blogService.getAllBlogs(query);
    return new OkResponse(blogs).send(res);
  });

  getBlogBySlug = asyncHandler(async (req, res, _next) => {
    const slug = String(req.params.slug ?? '');
    const blog = await blogService.getBlogBySlug(slug);
    return new OkResponse(blog).send(res);
  });

  likeBlog = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const blogId = validateSchema(ObjectIdSchema, req.params.id);
    const result = await blogService.likeBlog(blogId, req.user.id);
    return new OkResponse(result).send(res);
  });

  createReview = asyncHandler(async (req, res, _next) => {
    isAuth(req);
    const blogId = validateSchema(ObjectIdSchema, req.params.id);
    const { comment } = validateSchema(CreateReviewSchema, req.body);
    const review = await blogService.createReview(blogId, req.user.id, comment);
    return new OkResponse(review).send(res);
  });

  getAllBlogsForAdmin = asyncHandler(async (_req, res, _next) => {
    const blogs = await blogService.getAllBlogsForAdmin();
    return new OkResponse(blogs).send(res);
  });

  createBlog = asyncHandler(async (req, res, _next) => {
    const data = validateSchema(CreateBlogSchema, req.body);
    await blogService.createBlog(data);
    return new CreatedResponse('Blog created successfully').send(res);
  });

  updateBlog = asyncHandler(async (req, res, _next) => {
    const blogId = validateSchema(ObjectIdSchema, req.params.id);
    const data = validateSchema(UpdateBlogSchema, req.body);
    await blogService.updateBlog(blogId, data);
    return new AcceptedResponse('Blog updated successfully').send(res);
  });

  deleteBlog = asyncHandler(async (req, res, _next) => {
    const blogId = validateSchema(ObjectIdSchema, req.params.id);
    await blogService.deleteBlog(blogId);
    return new AcceptedResponse('Blog deleted successfully').send(res);
  });
}

export const blogController = new BlogController();
