import { Prisma } from '@prisma/client';
import { removeUndefinedProps } from '@/shared/helper/object.helper';
import { ListBlogQueryDTO, UpdateBlogDTO } from './blog.type';

interface BlogReviewItem {
  id: string;
  comment: string;
  createdAt: Date;
  author?: { name: string | null } | null;
}

interface BlogDetailWithRelations {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string;
  thumbnail: string;
  slug: string;
  readTime: string | null;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: { likes: number } | null;
  reviews?: BlogReviewItem[] | null;
}

/**
 * Builds Prisma `where` filter clause for public blog query.
 */
export const buildBlogSearchWhereClause = (query: ListBlogQueryDTO) => {
  const where: {
    OR?: {
      title?: { contains: string; mode: 'insensitive' };
      summary?: { contains: string; mode: 'insensitive' };
    }[];
    tags?: { contains: string; mode: 'insensitive' };
  } = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { summary: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.tag) {
    where.tags = { contains: query.tag, mode: 'insensitive' };
  }

  return where;
};

/**
 * Formats a detailed blog record with mapped review authors and counts.
 */
export const formatBlogDetailResponse = (blog: BlogDetailWithRelations) => {
  return {
    id: blog.id,
    title: blog.title,
    content: blog.content,
    summary: blog.summary,
    tags: blog.tags,
    thumbnail: blog.thumbnail,
    slug: blog.slug,
    readTime: blog.readTime,
    views: blog.views + 1,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    likes: blog._count?.likes ?? 0,
    reviews: (blog.reviews || []).map((review) => ({
      id: review.id,
      userName: review.author?.name || 'Anonymous',
      comment: review.comment,
      createdAt: review.createdAt,
    })),
  };
};

/**
 * Builds sanitized Prisma update payload for blog entities.
 */
export const buildBlogUpdatePayload = (data: UpdateBlogDTO): Prisma.BlogUpdateInput => {
  return removeUndefinedProps({
    title: data.title,
    content: data.content,
    summary: data.summary,
    tags: data.tags,
    thumbnail: data.thumbnail,
    slug: data.slug,
    readTime: data.readTime,
  }) as Prisma.BlogUpdateInput;
};
