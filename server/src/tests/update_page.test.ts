import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pagesTable } from '../db/schema';
import { type UpdatePageInput, type CreatePageInput } from '../schema';
import { updatePage } from '../handlers/update_page';

import { eq } from 'drizzle-orm';

describe('updatePage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test page
  const createTestPage = async () => {
    const testInput: CreatePageInput = {
      slug: 'test-page',
      title: 'Original Title',
      content: 'Original content',
      meta_description: 'Original meta description',
      meta_keywords: 'original, keywords',
      is_published: false
    };
    
    return await db.insert(pagesTable)
      .values({
        ...testInput,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute()
      .then(result => result[0]);
  };

  it('should update a page with all fields', async () => {
    const originalPage = await createTestPage();
    
    const updateInput: UpdatePageInput = {
      id: originalPage.id,
      slug: 'updated-slug',
      title: 'Updated Title',
      content: 'Updated content',
      meta_description: 'Updated meta description',
      meta_keywords: 'updated, keywords',
      is_published: true
    };

    const result = await updatePage(updateInput);

    expect(result.id).toEqual(originalPage.id);
    expect(result.slug).toEqual('updated-slug');
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Updated content');
    expect(result.meta_description).toEqual('Updated meta description');
    expect(result.meta_keywords).toEqual('updated, keywords');
    expect(result.is_published).toEqual(true);
    expect(result.created_at).toEqual(originalPage.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalPage.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    const originalPage = await createTestPage();
    
    const updateInput: UpdatePageInput = {
      id: originalPage.id,
      title: 'Updated Title Only',
      is_published: true
    };

    const result = await updatePage(updateInput);

    // Updated fields
    expect(result.title).toEqual('Updated Title Only');
    expect(result.is_published).toEqual(true);
    
    // Unchanged fields
    expect(result.slug).toEqual(originalPage.slug);
    expect(result.content).toEqual(originalPage.content);
    expect(result.meta_description).toEqual(originalPage.meta_description);
    expect(result.meta_keywords).toEqual(originalPage.meta_keywords);
    expect(result.created_at).toEqual(originalPage.created_at);
    
    // Always updated
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalPage.updated_at).toBe(true);
  });

  it('should update page with null values', async () => {
    const originalPage = await createTestPage();
    
    const updateInput: UpdatePageInput = {
      id: originalPage.id,
      meta_description: null,
      meta_keywords: null
    };

    const result = await updatePage(updateInput);

    expect(result.meta_description).toBeNull();
    expect(result.meta_keywords).toBeNull();
    expect(result.title).toEqual(originalPage.title); // Unchanged
  });

  it('should save updated page to database', async () => {
    const originalPage = await createTestPage();
    
    const updateInput: UpdatePageInput = {
      id: originalPage.id,
      title: 'Database Update Test',
      content: 'Updated content for database test'
    };

    const result = await updatePage(updateInput);

    // Verify changes were persisted in database
    const pages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, result.id))
      .execute();

    expect(pages).toHaveLength(1);
    expect(pages[0].title).toEqual('Database Update Test');
    expect(pages[0].content).toEqual('Updated content for database test');
    expect(pages[0].slug).toEqual(originalPage.slug); // Unchanged
    expect(pages[0].updated_at).toBeInstanceOf(Date);
    expect(pages[0].updated_at > originalPage.updated_at).toBe(true);
  });

  it('should throw error for non-existent page', async () => {
    const updateInput: UpdatePageInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updatePage(updateInput))
      .rejects
      .toThrow(/Page with id 99999 not found/i);
  });

  it('should handle edge case with minimal update', async () => {
    const originalPage = await createTestPage();
    
    const updateInput: UpdatePageInput = {
      id: originalPage.id
      // No other fields provided, only updated_at should change
    };

    const result = await updatePage(updateInput);

    // All original fields should remain the same except updated_at
    expect(result.slug).toEqual(originalPage.slug);
    expect(result.title).toEqual(originalPage.title);
    expect(result.content).toEqual(originalPage.content);
    expect(result.meta_description).toEqual(originalPage.meta_description);
    expect(result.meta_keywords).toEqual(originalPage.meta_keywords);
    expect(result.is_published).toEqual(originalPage.is_published);
    expect(result.created_at).toEqual(originalPage.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalPage.updated_at).toBe(true);
  });

  it('should handle slug update correctly', async () => {
    const originalPage = await createTestPage();
    
    const updateInput: UpdatePageInput = {
      id: originalPage.id,
      slug: 'brand-new-slug'
    };

    const result = await updatePage(updateInput);

    expect(result.slug).toEqual('brand-new-slug');
    
    // Verify in database
    const pages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.slug, 'brand-new-slug'))
      .execute();

    expect(pages).toHaveLength(1);
    expect(pages[0].id).toEqual(originalPage.id);
  });

  it('should handle boolean field updates correctly', async () => {
    const originalPage = await createTestPage();
    expect(originalPage.is_published).toBe(false);
    
    // Update to true
    const updateInput1: UpdatePageInput = {
      id: originalPage.id,
      is_published: true
    };

    const result1 = await updatePage(updateInput1);
    expect(result1.is_published).toBe(true);

    // Update back to false
    const updateInput2: UpdatePageInput = {
      id: originalPage.id,
      is_published: false
    };

    const result2 = await updatePage(updateInput2);
    expect(result2.is_published).toBe(false);
  });
});