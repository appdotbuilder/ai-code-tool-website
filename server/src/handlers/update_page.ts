import { db } from '../db';
import { pagesTable } from '../db/schema';
import { type UpdatePageInput, type Page } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePage = async (input: UpdatePageInput): Promise<Page> => {
  try {
    // First verify the page exists
    const existingPages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, input.id))
      .execute();

    if (existingPages.length === 0) {
      throw new Error(`Page with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof pagesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    if (input.meta_description !== undefined) {
      updateData.meta_description = input.meta_description;
    }

    if (input.meta_keywords !== undefined) {
      updateData.meta_keywords = input.meta_keywords;
    }

    if (input.is_published !== undefined) {
      updateData.is_published = input.is_published;
    }

    // Perform the update
    const result = await db.update(pagesTable)
      .set(updateData)
      .where(eq(pagesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Page update failed:', error);
    throw error;
  }
};