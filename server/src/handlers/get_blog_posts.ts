import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type BlogPost } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const results = await db.select()
      .from(blogPostsTable)
      .orderBy(desc(blogPostsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    throw error;
  }
};

export const getPublishedBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const results = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.is_published, true))
      .orderBy(desc(blogPostsTable.published_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch published blog posts:', error);
    throw error;
  }
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  try {
    const results = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.slug, slug))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch blog post by slug:', error);
    throw error;
  }
};