import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type CreateBlogPostInput } from '../schema';
import { createBlogPost } from '../handlers/create_blog_post';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateBlogPostInput = {
  slug: 'test-blog-post',
  title: 'Test Blog Post',
  excerpt: 'This is a test excerpt',
  content: 'This is the test content for the blog post',
  author: 'Test Author',
  featured_image_url: 'https://example.com/image.jpg',
  meta_description: 'Test meta description',
  meta_keywords: 'test, blog, post',
  is_published: false,
  published_at: null
};

describe('createBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a blog post with all fields', async () => {
    const result = await createBlogPost(testInput);

    // Basic field validation
    expect(result.slug).toEqual('test-blog-post');
    expect(result.title).toEqual('Test Blog Post');
    expect(result.excerpt).toEqual('This is a test excerpt');
    expect(result.content).toEqual('This is the test content for the blog post');
    expect(result.author).toEqual('Test Author');
    expect(result.featured_image_url).toEqual('https://example.com/image.jpg');
    expect(result.meta_description).toEqual('Test meta description');
    expect(result.meta_keywords).toEqual('test, blog, post');
    expect(result.is_published).toEqual(false);
    expect(result.published_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a blog post with minimal fields', async () => {
    const minimalInput: CreateBlogPostInput = {
      slug: 'minimal-post',
      title: 'Minimal Post',
      excerpt: null,
      content: 'Just content',
      author: 'Author',
      featured_image_url: null,
      meta_description: null,
      meta_keywords: null,
      is_published: true,
      published_at: new Date('2024-01-01')
    };

    const result = await createBlogPost(minimalInput);

    expect(result.slug).toEqual('minimal-post');
    expect(result.title).toEqual('Minimal Post');
    expect(result.excerpt).toBeNull();
    expect(result.content).toEqual('Just content');
    expect(result.author).toEqual('Author');
    expect(result.featured_image_url).toBeNull();
    expect(result.meta_description).toBeNull();
    expect(result.meta_keywords).toBeNull();
    expect(result.is_published).toEqual(true);
    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('should save blog post to database', async () => {
    const result = await createBlogPost(testInput);

    // Query using proper drizzle syntax
    const blogPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(blogPosts).toHaveLength(1);
    expect(blogPosts[0].slug).toEqual('test-blog-post');
    expect(blogPosts[0].title).toEqual('Test Blog Post');
    expect(blogPosts[0].excerpt).toEqual('This is a test excerpt');
    expect(blogPosts[0].content).toEqual('This is the test content for the blog post');
    expect(blogPosts[0].author).toEqual('Test Author');
    expect(blogPosts[0].featured_image_url).toEqual('https://example.com/image.jpg');
    expect(blogPosts[0].meta_description).toEqual('Test meta description');
    expect(blogPosts[0].meta_keywords).toEqual('test, blog, post');
    expect(blogPosts[0].is_published).toEqual(false);
    expect(blogPosts[0].published_at).toBeNull();
    expect(blogPosts[0].created_at).toBeInstanceOf(Date);
    expect(blogPosts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create published blog post with published_at date', async () => {
    const publishedDate = new Date('2024-01-15T10:00:00Z');
    const publishedInput: CreateBlogPostInput = {
      ...testInput,
      is_published: true,
      published_at: publishedDate
    };

    const result = await createBlogPost(publishedInput);

    expect(result.is_published).toEqual(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at?.toISOString()).toEqual(publishedDate.toISOString());
  });

  it('should handle duplicate slug constraint violation', async () => {
    // Create first blog post
    await createBlogPost(testInput);

    // Try to create another with same slug
    const duplicateInput: CreateBlogPostInput = {
      ...testInput,
      title: 'Different Title'
    };

    await expect(createBlogPost(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should create multiple blog posts with different slugs', async () => {
    const firstPost = await createBlogPost(testInput);
    
    const secondInput: CreateBlogPostInput = {
      ...testInput,
      slug: 'second-blog-post',
      title: 'Second Blog Post'
    };
    
    const secondPost = await createBlogPost(secondInput);

    expect(firstPost.id).not.toEqual(secondPost.id);
    expect(firstPost.slug).toEqual('test-blog-post');
    expect(secondPost.slug).toEqual('second-blog-post');

    // Verify both exist in database
    const allPosts = await db.select().from(blogPostsTable).execute();
    expect(allPosts).toHaveLength(2);
  });
});