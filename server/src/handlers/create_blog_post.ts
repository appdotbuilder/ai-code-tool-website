import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type CreateBlogPostInput, type BlogPost } from '../schema';

export const createBlogPost = async (input: CreateBlogPostInput): Promise<BlogPost> => {
  try {
    // Insert blog post record
    const result = await db.insert(blogPostsTable)
      .values({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        author: input.author,
        featured_image_url: input.featured_image_url,
        meta_description: input.meta_description,
        meta_keywords: input.meta_keywords,
        is_published: input.is_published,
        published_at: input.published_at
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Blog post creation failed:', error);
    throw error;
  }
};