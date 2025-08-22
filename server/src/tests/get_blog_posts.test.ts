import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type CreateBlogPostInput } from '../schema';
import { getBlogPosts, getPublishedBlogPosts, getBlogPostBySlug } from '../handlers/get_blog_posts';

// Test data
const testBlogPost1: Omit<CreateBlogPostInput, 'is_published' | 'published_at'> & {
  is_published: boolean;
  published_at: Date | null;
} = {
  slug: 'first-blog-post',
  title: 'First Blog Post',
  excerpt: 'This is the first blog post excerpt',
  content: 'This is the full content of the first blog post',
  author: 'John Doe',
  featured_image_url: 'https://example.com/image1.jpg',
  meta_description: 'First blog post meta description',
  meta_keywords: 'blog, first, post',
  is_published: true,
  published_at: new Date('2024-01-15')
};

const testBlogPost2: Omit<CreateBlogPostInput, 'is_published' | 'published_at'> & {
  is_published: boolean;
  published_at: Date | null;
} = {
  slug: 'draft-blog-post',
  title: 'Draft Blog Post',
  excerpt: 'This is a draft blog post',
  content: 'This is the content of a draft blog post',
  author: 'Jane Smith',
  featured_image_url: null,
  meta_description: null,
  meta_keywords: null,
  is_published: false,
  published_at: null
};

const testBlogPost3: Omit<CreateBlogPostInput, 'is_published' | 'published_at'> & {
  is_published: boolean;
  published_at: Date | null;
} = {
  slug: 'second-blog-post',
  title: 'Second Blog Post',
  excerpt: 'This is the second blog post excerpt',
  content: 'This is the content of the second blog post',
  author: 'Bob Wilson',
  featured_image_url: 'https://example.com/image2.jpg',
  meta_description: 'Second blog post meta description',
  meta_keywords: 'blog, second, post',
  is_published: true,
  published_at: new Date('2024-01-20')
};

describe('getBlogPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no blog posts exist', async () => {
    const result = await getBlogPosts();
    expect(result).toEqual([]);
  });

  it('should return all blog posts ordered by created_at desc', async () => {
    // Insert test blog posts
    await db.insert(blogPostsTable).values([
      testBlogPost1,
      testBlogPost2,
      testBlogPost3
    ]).execute();

    const result = await getBlogPosts();

    expect(result).toHaveLength(3);
    
    // Should include both published and unpublished posts
    const slugs = result.map(post => post.slug);
    expect(slugs).toContain('first-blog-post');
    expect(slugs).toContain('draft-blog-post');
    expect(slugs).toContain('second-blog-post');

    // Verify all fields are present
    const firstPost = result[0];
    expect(firstPost.id).toBeDefined();
    expect(firstPost.slug).toBeDefined();
    expect(firstPost.title).toBeDefined();
    expect(firstPost.content).toBeDefined();
    expect(firstPost.author).toBeDefined();
    expect(firstPost.is_published).toBeBoolean();
    expect(firstPost.created_at).toBeInstanceOf(Date);
    expect(firstPost.updated_at).toBeInstanceOf(Date);
  });

  it('should order blog posts by created_at in descending order', async () => {
    // Insert posts with slight delay to ensure different created_at times
    await db.insert(blogPostsTable).values(testBlogPost1).execute();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    await db.insert(blogPostsTable).values(testBlogPost2).execute();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    await db.insert(blogPostsTable).values(testBlogPost3).execute();

    const result = await getBlogPosts();

    expect(result).toHaveLength(3);
    
    // Should be ordered by created_at desc (newest first)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
  });
});

describe('getPublishedBlogPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no published blog posts exist', async () => {
    // Insert only draft posts
    await db.insert(blogPostsTable).values(testBlogPost2).execute();

    const result = await getPublishedBlogPosts();
    expect(result).toEqual([]);
  });

  it('should return only published blog posts', async () => {
    // Insert mix of published and draft posts
    await db.insert(blogPostsTable).values([
      testBlogPost1, // published
      testBlogPost2, // draft
      testBlogPost3  // published
    ]).execute();

    const result = await getPublishedBlogPosts();

    expect(result).toHaveLength(2);
    
    // Should only include published posts
    const slugs = result.map(post => post.slug);
    expect(slugs).toContain('first-blog-post');
    expect(slugs).toContain('second-blog-post');
    expect(slugs).not.toContain('draft-blog-post');

    // All returned posts should be published
    result.forEach(post => {
      expect(post.is_published).toBe(true);
    });
  });

  it('should order published blog posts by published_at desc', async () => {
    // Insert published posts with different published_at dates
    await db.insert(blogPostsTable).values([
      testBlogPost1, // published 2024-01-15
      testBlogPost3  // published 2024-01-20
    ]).execute();

    const result = await getPublishedBlogPosts();

    expect(result).toHaveLength(2);
    
    // Should be ordered by published_at desc (newest first)
    expect(result[0].slug).toBe('second-blog-post'); // 2024-01-20
    expect(result[1].slug).toBe('first-blog-post');  // 2024-01-15
  });

  it('should handle posts with null published_at correctly', async () => {
    // Create a published post with null published_at
    const publishedPostWithoutDate = {
      ...testBlogPost1,
      slug: 'published-no-date',
      published_at: null
    };

    await db.insert(blogPostsTable).values([
      publishedPostWithoutDate,
      testBlogPost3
    ]).execute();

    const result = await getPublishedBlogPosts();

    expect(result).toHaveLength(2);
    // Both should be returned since they're published
    const slugs = result.map(post => post.slug);
    expect(slugs).toContain('published-no-date');
    expect(slugs).toContain('second-blog-post');
  });
});

describe('getBlogPostBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when blog post with slug does not exist', async () => {
    const result = await getBlogPostBySlug('non-existent-slug');
    expect(result).toBeNull();
  });

  it('should return blog post when slug exists', async () => {
    // Insert test blog post
    await db.insert(blogPostsTable).values(testBlogPost1).execute();

    const result = await getBlogPostBySlug('first-blog-post');

    expect(result).not.toBeNull();
    expect(result!.slug).toBe('first-blog-post');
    expect(result!.title).toBe('First Blog Post');
    expect(result!.content).toBe('This is the full content of the first blog post');
    expect(result!.author).toBe('John Doe');
    expect(result!.excerpt).toBe('This is the first blog post excerpt');
    expect(result!.featured_image_url).toBe('https://example.com/image1.jpg');
    expect(result!.meta_description).toBe('First blog post meta description');
    expect(result!.meta_keywords).toBe('blog, first, post');
    expect(result!.is_published).toBe(true);
    expect(result!.published_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return draft blog post when slug exists', async () => {
    // Insert draft blog post
    await db.insert(blogPostsTable).values(testBlogPost2).execute();

    const result = await getBlogPostBySlug('draft-blog-post');

    expect(result).not.toBeNull();
    expect(result!.slug).toBe('draft-blog-post');
    expect(result!.title).toBe('Draft Blog Post');
    expect(result!.is_published).toBe(false);
    expect(result!.published_at).toBeNull();
  });

  it('should handle blog posts with null optional fields', async () => {
    // Insert blog post with minimal required fields
    const minimalPost = {
      slug: 'minimal-post',
      title: 'Minimal Post',
      excerpt: null,
      content: 'Minimal content',
      author: 'Test Author',
      featured_image_url: null,
      meta_description: null,
      meta_keywords: null,
      is_published: false,
      published_at: null
    };

    await db.insert(blogPostsTable).values(minimalPost).execute();

    const result = await getBlogPostBySlug('minimal-post');

    expect(result).not.toBeNull();
    expect(result!.slug).toBe('minimal-post');
    expect(result!.excerpt).toBeNull();
    expect(result!.featured_image_url).toBeNull();
    expect(result!.meta_description).toBeNull();
    expect(result!.meta_keywords).toBeNull();
    expect(result!.published_at).toBeNull();
  });

  it('should be case sensitive for slug matching', async () => {
    // Insert test blog post
    await db.insert(blogPostsTable).values(testBlogPost1).execute();

    // Should not match with different case
    const result = await getBlogPostBySlug('First-Blog-Post');
    expect(result).toBeNull();

    // Should match exact case
    const exactResult = await getBlogPostBySlug('first-blog-post');
    expect(exactResult).not.toBeNull();
  });
});