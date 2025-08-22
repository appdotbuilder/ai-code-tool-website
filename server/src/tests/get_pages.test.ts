import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pagesTable } from '../db/schema';
import { getPages, getPageBySlug, getPublishedPages } from '../handlers/get_pages';

describe('getPages handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestPage = async (overrides = {}) => {
    const defaultPage = {
      slug: 'test-page',
      title: 'Test Page',
      content: '<h1>Test Content</h1>',
      meta_description: 'Test meta description',
      meta_keywords: 'test, keywords',
      is_published: true,
      ...overrides
    };

    const result = await db.insert(pagesTable)
      .values(defaultPage)
      .returning()
      .execute();

    return result[0];
  };

  describe('getPages', () => {
    it('should return empty array when no pages exist', async () => {
      const pages = await getPages();
      expect(pages).toEqual([]);
    });

    it('should return all pages when they exist', async () => {
      // Create multiple test pages
      await createTestPage({ slug: 'home', title: 'Home Page', is_published: true });
      await createTestPage({ slug: 'about', title: 'About Page', is_published: false });
      await createTestPage({ slug: 'contact', title: 'Contact Page', is_published: true });

      const pages = await getPages();

      expect(pages).toHaveLength(3);
      
      // Verify all pages are included regardless of published status
      const slugs = pages.map(p => p.slug).sort();
      expect(slugs).toEqual(['about', 'contact', 'home']);
      
      // Verify structure of returned pages
      pages.forEach(page => {
        expect(page.id).toBeDefined();
        expect(typeof page.slug).toBe('string');
        expect(typeof page.title).toBe('string');
        expect(typeof page.content).toBe('string');
        expect(typeof page.is_published).toBe('boolean');
        expect(page.created_at).toBeInstanceOf(Date);
        expect(page.updated_at).toBeInstanceOf(Date);
      });
    });

    it('should return pages with correct field types', async () => {
      await createTestPage({
        slug: 'features',
        title: 'Features Page',
        content: '<div>Features content</div>',
        meta_description: null,
        meta_keywords: null,
        is_published: false
      });

      const pages = await getPages();
      const page = pages[0];

      expect(page.id).toBeTypeOf('number');
      expect(page.slug).toBe('features');
      expect(page.title).toBe('Features Page');
      expect(page.content).toBe('<div>Features content</div>');
      expect(page.meta_description).toBe(null);
      expect(page.meta_keywords).toBe(null);
      expect(page.is_published).toBe(false);
      expect(page.created_at).toBeInstanceOf(Date);
      expect(page.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getPageBySlug', () => {
    it('should return null when page does not exist', async () => {
      const page = await getPageBySlug('nonexistent');
      expect(page).toBe(null);
    });

    it('should return page when it exists', async () => {
      const createdPage = await createTestPage({
        slug: 'pricing',
        title: 'Pricing Page',
        content: '<div>Pricing information</div>',
        meta_description: 'Pricing page description',
        is_published: true
      });

      const page = await getPageBySlug('pricing');

      expect(page).not.toBe(null);
      expect(page!.id).toBe(createdPage.id);
      expect(page!.slug).toBe('pricing');
      expect(page!.title).toBe('Pricing Page');
      expect(page!.content).toBe('<div>Pricing information</div>');
      expect(page!.meta_description).toBe('Pricing page description');
      expect(page!.is_published).toBe(true);
      expect(page!.created_at).toBeInstanceOf(Date);
    });

    it('should return correct page when multiple pages exist', async () => {
      await createTestPage({ slug: 'home', title: 'Home Page' });
      await createTestPage({ slug: 'about', title: 'About Page' });
      const targetPage = await createTestPage({ slug: 'contact', title: 'Contact Page' });

      const page = await getPageBySlug('contact');

      expect(page).not.toBe(null);
      expect(page!.id).toBe(targetPage.id);
      expect(page!.slug).toBe('contact');
      expect(page!.title).toBe('Contact Page');
    });

    it('should be case sensitive for slug matching', async () => {
      await createTestPage({ slug: 'About', title: 'About Page' });

      const page = await getPageBySlug('about');
      expect(page).toBe(null);

      const correctPage = await getPageBySlug('About');
      expect(correctPage).not.toBe(null);
      expect(correctPage!.slug).toBe('About');
    });
  });

  describe('getPublishedPages', () => {
    it('should return empty array when no published pages exist', async () => {
      // Create unpublished pages
      await createTestPage({ slug: 'draft1', is_published: false });
      await createTestPage({ slug: 'draft2', is_published: false });

      const pages = await getPublishedPages();
      expect(pages).toEqual([]);
    });

    it('should return only published pages', async () => {
      // Create mix of published and unpublished pages
      await createTestPage({ slug: 'home', title: 'Home Page', is_published: true });
      await createTestPage({ slug: 'draft', title: 'Draft Page', is_published: false });
      await createTestPage({ slug: 'about', title: 'About Page', is_published: true });
      await createTestPage({ slug: 'hidden', title: 'Hidden Page', is_published: false });

      const pages = await getPublishedPages();

      expect(pages).toHaveLength(2);
      
      // Verify only published pages are returned
      const publishedSlugs = pages.map(p => p.slug).sort();
      expect(publishedSlugs).toEqual(['about', 'home']);
      
      // Verify all returned pages are published
      pages.forEach(page => {
        expect(page.is_published).toBe(true);
      });
    });

    it('should return all pages when all are published', async () => {
      await createTestPage({ slug: 'home', title: 'Home Page', is_published: true });
      await createTestPage({ slug: 'features', title: 'Features Page', is_published: true });
      await createTestPage({ slug: 'pricing', title: 'Pricing Page', is_published: true });

      const pages = await getPublishedPages();

      expect(pages).toHaveLength(3);
      pages.forEach(page => {
        expect(page.is_published).toBe(true);
      });
    });

    it('should maintain correct data structure for published pages', async () => {
      await createTestPage({
        slug: 'published-page',
        title: 'Published Page',
        content: '<p>Published content</p>',
        meta_description: 'Published page meta',
        meta_keywords: 'published, page',
        is_published: true
      });

      const pages = await getPublishedPages();
      const page = pages[0];

      expect(page.slug).toBe('published-page');
      expect(page.title).toBe('Published Page');
      expect(page.content).toBe('<p>Published content</p>');
      expect(page.meta_description).toBe('Published page meta');
      expect(page.meta_keywords).toBe('published, page');
      expect(page.is_published).toBe(true);
      expect(page.created_at).toBeInstanceOf(Date);
      expect(page.updated_at).toBeInstanceOf(Date);
    });
  });
});