import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pagesTable } from '../db/schema';
import { type CreatePageInput } from '../schema';
import { createPage } from '../handlers/create_page';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreatePageInput = {
  slug: 'home',
  title: 'Home Page',
  content: '<h1>Welcome to our AI Tool</h1><p>This is the home page content.</p>',
  meta_description: 'Welcome to our innovative AI tool platform',
  meta_keywords: 'AI, tool, platform, innovation',
  is_published: true
};

// Minimal test input with nullable fields as null
const minimalInput: CreatePageInput = {
  slug: 'about',
  title: 'About Us',
  content: '<p>About us page content</p>',
  meta_description: null,
  meta_keywords: null,
  is_published: false
};

describe('createPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a page with all fields', async () => {
    const result = await createPage(testInput);

    // Basic field validation
    expect(result.slug).toEqual('home');
    expect(result.title).toEqual('Home Page');
    expect(result.content).toEqual('<h1>Welcome to our AI Tool</h1><p>This is the home page content.</p>');
    expect(result.meta_description).toEqual('Welcome to our innovative AI tool platform');
    expect(result.meta_keywords).toEqual('AI, tool, platform, innovation');
    expect(result.is_published).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a page with minimal fields', async () => {
    const result = await createPage(minimalInput);

    expect(result.slug).toEqual('about');
    expect(result.title).toEqual('About Us');
    expect(result.content).toEqual('<p>About us page content</p>');
    expect(result.meta_description).toBeNull();
    expect(result.meta_keywords).toBeNull();
    expect(result.is_published).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save page to database', async () => {
    const result = await createPage(testInput);

    // Query using proper drizzle syntax
    const pages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, result.id))
      .execute();

    expect(pages).toHaveLength(1);
    expect(pages[0].slug).toEqual('home');
    expect(pages[0].title).toEqual('Home Page');
    expect(pages[0].content).toEqual(testInput.content);
    expect(pages[0].meta_description).toEqual(testInput.meta_description);
    expect(pages[0].meta_keywords).toEqual(testInput.meta_keywords);
    expect(pages[0].is_published).toEqual(true);
    expect(pages[0].created_at).toBeInstanceOf(Date);
    expect(pages[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create page with Zod default for is_published', async () => {
    const inputWithoutPublished: CreatePageInput = {
      slug: 'features',
      title: 'Features',
      content: '<p>Features page content</p>',
      meta_description: null,
      meta_keywords: null,
      is_published: false // Zod default is false
    };

    const result = await createPage(inputWithoutPublished);

    expect(result.is_published).toEqual(false);
  });

  it('should create multiple pages with different slugs', async () => {
    const homeInput: CreatePageInput = {
      slug: 'home',
      title: 'Home',
      content: '<p>Home content</p>',
      meta_description: null,
      meta_keywords: null,
      is_published: true
    };

    const pricingInput: CreatePageInput = {
      slug: 'pricing',
      title: 'Pricing',
      content: '<p>Pricing content</p>',
      meta_description: 'Our pricing plans',
      meta_keywords: 'pricing, plans, cost',
      is_published: true
    };

    const homeResult = await createPage(homeInput);
    const pricingResult = await createPage(pricingInput);

    expect(homeResult.slug).toEqual('home');
    expect(pricingResult.slug).toEqual('pricing');
    expect(homeResult.id).not.toEqual(pricingResult.id);

    // Verify both pages exist in database
    const allPages = await db.select()
      .from(pagesTable)
      .execute();

    expect(allPages).toHaveLength(2);
    const slugs = allPages.map(page => page.slug).sort();
    expect(slugs).toEqual(['home', 'pricing']);
  });

  it('should handle HTML content correctly', async () => {
    const htmlInput: CreatePageInput = {
      slug: 'contact',
      title: 'Contact Us',
      content: `
        <div class="contact-form">
          <h2>Get in Touch</h2>
          <form>
            <input type="email" placeholder="your@email.com" />
            <textarea placeholder="Your message"></textarea>
            <button type="submit">Send Message</button>
          </form>
        </div>
      `,
      meta_description: 'Contact us for support and inquiries',
      meta_keywords: 'contact, support, help, inquiries',
      is_published: true
    };

    const result = await createPage(htmlInput);

    expect(result.content).toContain('<div class="contact-form">');
    expect(result.content).toContain('<input type="email"');
    expect(result.content).toContain('<textarea placeholder="Your message">');

    // Verify content is stored correctly in database
    const pages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, result.id))
      .execute();

    expect(pages[0].content).toEqual(htmlInput.content);
  });

  it('should reject duplicate slugs', async () => {
    // Create first page
    await createPage(testInput);

    // Try to create another page with the same slug
    const duplicateInput: CreatePageInput = {
      slug: 'home', // Same slug as testInput
      title: 'Another Home Page',
      content: '<p>Different content</p>',
      meta_description: null,
      meta_keywords: null,
      is_published: false
    };

    // Should throw error due to unique constraint on slug
    expect(createPage(duplicateInput)).rejects.toThrow(/unique/i);
  });
});