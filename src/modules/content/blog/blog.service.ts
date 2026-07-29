import prisma from '@/config/prisma';
import { NotFoundError, ValidationError } from '@/core/errors/ApiError';
import { getPaginationParams } from '@/shared/helper/pagination.helper';
import {
  buildBlogSearchWhereClause,
  buildBlogUpdatePayload,
  formatBlogDetailResponse,
} from './blog.helper';
import { CreateBlogDTO, ListBlogQueryDTO, UpdateBlogDTO } from './blog.type';

class BlogService {
  async getAllBlogs(query: ListBlogQueryDTO) {
    const { skip, limit } = getPaginationParams(query.page, query.limit, 100);
    const where = buildBlogSearchWhereClause(query);

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        tags: true,
        thumbnail: true,
        slug: true,
        readTime: true,
        views: true,
        createdAt: true,
      },
    });

    return blogs;
  }

  async getBlogBySlug(slug: string) {
    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { name: true } },
          },
        },
        _count: { select: { likes: true } },
      },
    });

    if (!blog) {
      throw new NotFoundError('Blog not found');
    }

    await prisma.blog.update({
      where: { id: blog.id },
      data: { views: { increment: 1 } },
    });

    return formatBlogDetailResponse(blog);
  }

  async likeBlog(blogId: string, userId: string) {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) {
      throw new NotFoundError('Blog not found');
    }

    const existingLike = await prisma.blogLike.findFirst({
      where: { blogId, userId },
    });

    if (existingLike) {
      await prisma.blogLike.delete({ where: { id: existingLike.id } });
    } else {
      await prisma.blogLike.create({ data: { blogId, userId } });
    }

    const likes = await prisma.blogLike.count({ where: { blogId } });

    return { liked: !existingLike, likes };
  }

  async createReview(blogId: string, userId: string, comment: string) {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) {
      throw new NotFoundError('Blog not found');
    }

    const review = await prisma.blogReview.create({
      data: { blogId, userId, comment },
      include: { author: { select: { name: true } } },
    });

    return {
      id: review.id,
      userName: review.author.name,
      comment: review.comment,
      createdAt: review.createdAt,
    };
  }

  async getAllBlogsForAdmin() {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return blogs;
  }

  async createBlog(data: CreateBlogDTO) {
    const existing = await prisma.blog.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ValidationError('A blog with this slug already exists');
    }

    await prisma.blog.create({
      data: {
        title: data.title,
        content: data.content,
        summary: data.summary,
        tags: data.tags,
        thumbnail: data.thumbnail,
        slug: data.slug,
        readTime: data.readTime ?? null,
      },
    });

    return;
  }

  async updateBlog(id: string, data: UpdateBlogDTO) {
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Blog not found');
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.blog.findUnique({ where: { slug: data.slug } });
      if (slugTaken) {
        throw new ValidationError('A blog with this slug already exists');
      }
    }

    const updateData = buildBlogUpdatePayload(data);

    await prisma.blog.update({
      where: { id },
      data: updateData,
    });

    return;
  }

  async deleteBlog(id: string) {
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Blog not found');
    }

    await prisma.$transaction([
      prisma.blogReview.deleteMany({ where: { blogId: id } }),
      prisma.blogLike.deleteMany({ where: { blogId: id } }),
      prisma.blog.delete({ where: { id } }),
    ]);

    return;
  }
}

export const blogService = new BlogService();
