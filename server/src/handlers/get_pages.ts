import { db } from '../db';
import { pagesTable } from '../db/schema';
import { type Page } from '../schema';
import { eq } from 'drizzle-orm';

export const getPages = async (): Promise<Page[]> => {
  try {
    const results = await db.select()
      .from(pagesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch pages:', error);
    throw error;
  }
};

export const getPageBySlug = async (slug: string): Promise<Page | null> => {
  try {
    const results = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.slug, slug))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch page by slug:', error);
    throw error;
  }
};

export const getPublishedPages = async (): Promise<Page[]> => {
  try {
    const results = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.is_published, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch published pages:', error);
    throw error;
  }
};